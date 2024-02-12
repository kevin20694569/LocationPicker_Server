const { reaction, reactionProject } = require("./mongodbModel");
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection");

class Mongodb_ReactionsCollectionService {
  constructor() {
    this.reaction = reaction;
    this.reactionProject = reactionProject;

    this.postsCollectionService = new Mongodb_postsCollectionService();
  }

  async getPostReactions(post_id, selfUser_id, user_ids) {
    let results = await this.reaction.aggregate([
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
      {
        $project: {
          post_id: 1,
          user_id: 1,
          liked: 1,
          reaction: 1,
          updated_at: 1,
          isFriend: 1,
          _id: 0,
        },
      },
    ]);
    results.forEach((result) => {
      result["reaction"] = this.translateReactionToString(result["reaction"]);
    });

    return results;
  }

  async getSelfReaction(post_id, user_id) {
    let reaction = await this.reaction.findOne({ post_id: post_id, user_id: user_id });

    return reaction;
  }

  async getManyPostsSelfReaction(post_ids, request_user_id) {
    let reactions = await this.reaction.find(
      {
        post_id: { $in: post_ids },
        user_id: request_user_id,
      },
      this.reactionProject
    );

    console.log(reactions);

    return reactions;
  }

  async updateReaction(post_id, user_id, reactionString, liked) {
    try {
      liked = liked ?? false;
      if (reactionString == null && liked == false) {
        let lastReactionRow = await this.reaction.findOneAndDelete({ post_id: post_id, user_id: user_id });
        let { reaction: lastReaction, liked: lastLikedStatus } = lastReactionRow;
        let likedCount = lastLikedStatus ? -1 : 0;
        await this.postsCollectionService.updatePostReactionCount(post_id, reactionString, lastReaction, likedCount);
        return;
      }
      const filter = { post_id: post_id, user_id: user_id };
      let reactionRawValue = this.translateReactionToInt(reactionString);
      const update = {
        $set: {
          post_id: post_id,
          user_id: user_id,
          reaction: reactionRawValue,
          liked: liked,
          updated_at: new Date(),
        },
      };
      const options = { upsert: true };
      let lastReactionRow = await this.reaction.findOneAndUpdate(filter, update, options);
      if (lastReactionRow == null) {
        let likedNum = liked ? 1 : 0;
        await this.postsCollectionService.updatePostReactionCount(post_id, reactionString, null, likedNum);
        return;
      }
      let { reaction: lastReactionRawValue, liked: lastLikedStatus } = lastReactionRow;
      if (lastReactionRawValue != reactionRawValue || liked != lastLikedStatus) {
        let likedCount;
        if (liked == lastLikedStatus) {
          likedCount = 0;
        } else {
          likedCount = liked ? 1 : -1;
        }

        if (lastReactionRawValue == null) {
          await this.postsCollectionService.updatePostReactionCount(post_id, reactionString, null, likedCount);
        } else {
          const lastReactionType = this.translateReactionToString(reactionRawValue);
          await this.postsCollectionService.updatePostReactionCount(post_id, reactionString, lastReactionType, likedCount);
        }
      }
      return;
    } catch (error) {
      throw new Error(`updateReaction失敗${error}`);
    }
  }

  translateReactionToString(rawValue) {
    switch (rawValue) {
      case 0:
        return "love";
      case 1:
        return "vomit";
      case 2:
        return "angry";
      case 3:
        return "sad";
      case 4:
        return "surprise";
    }
    throw new Error("無法匹配reactionInt");
  }
  translateReactionToInt(string) {
    switch (string) {
      case "love":
        return 0;
      case "vomit":
        return 1;
      case "angry":
        return 2;
      case "sad":
        return 3;
      case "surprise":
        return 4;
    }
    throw new Error("無法匹配reactionString");
  }
}

module.exports = Mongodb_ReactionsCollectionService;
