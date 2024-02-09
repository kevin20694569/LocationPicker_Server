const { reaction } = require("./mongodbModel");
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection");
const postsCollectionService = new Mongodb_postsCollectionService();

class Mongodb_ReactionsCollectionService {
  constructor() {
    this.reaction = reaction;
    this.postsCollectionService = postsCollectionService;
  }

  async getPostReactions(post_id, selfUser_id, user_ids) {
    let result = this.reaction.aggregate([
      {
        $match: { post_id: post_id },
      },
      {
        $addFields: {
          isFriend: { $in: ["$user_id", user_ids] },
        },
      },
      {
        $sort: { isFriend: -1, updated_at: -1 }, // 根据 isFriend 字段进行排序，朋友的排在最前面
      },
      {
        $match: { user_id: { $ne: selfUser_id } },
      },
    ]);
    return result;
  }

  async getSelfReaction(post_id, user_id) {
    let reaction = await this.reaction.findOne({ post_id: post_id, user_id: user_id });
    return reaction;
  }

  async updateReaction(post_id, user_id, reaction, liked) {
    try {
      liked = liked ?? false;
      if (reaction == null && liked == false) {
        let lastReactionRow = await this.reaction.findOneAndDelete({ post_id: post_id, user_id: user_id });
        let { reaction: lastReaction, liked: lastLikedStatus } = lastReactionRow;
        let likedCount = lastLikedStatus ? -1 : 0;
        await this.postsCollectionService.updatePostReactionCount(post_id, reaction, lastReaction, likedCount);
        return;
      }
      const filter = { post_id: post_id, user_id: user_id };
      const update = {
        $set: {
          post_id: post_id,
          user_id: user_id,
          reaction: reaction,
          liked: liked,
          updated_at: new Date(),
        },
      };
      const options = { upsert: true };
      let lastReactionRow = await this.reaction.findOneAndUpdate(filter, update, options);
      if (lastReactionRow == null) {
        let likedNum = liked ? 1 : 0;
        await this.postsCollectionService.updatePostReactionCount(post_id, reaction, null, likedNum);
        return;
      }
      let { reaction: lastReaction, liked: lastLikedStatus } = lastReactionRow;
      if (lastReaction != reaction || liked != lastLikedStatus) {
        let likedCount;
        if (liked == lastLikedStatus) {
          likedCount = 0;
        } else {
          likedCount = liked ? 1 : -1;
        }
        if (lastReaction == null) {
          await this.postsCollectionService.updatePostReactionCount(post_id, reaction, null, likedCount);
        } else {
          await this.postsCollectionService.updatePostReactionCount(post_id, reaction, lastReaction, likedCount);
        }
      }
      return;
    } catch (error) {
      throw new Error(`updateReaction失敗${error}`);
    }
  }
}

module.exports = Mongodb_ReactionsCollectionService;
