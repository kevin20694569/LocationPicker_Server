class common_functionObject {
  constructor() {}

  mergeJsonPropertiesForPostsLengthEqualRestaurantLength(posts, users, restaurants) {
    let json = [];
    for (const [index, value] of posts.entries()) {
      let user;
      if (users[index]) {
        user = users[index];
      } else {
        for (const [index, result] of users.entries()) {
          if (result.user_id == value.user_id) {
            user = users[index];
          }
        }
      }
      const resultobject = {
        ...value,
        ...user,
        ...restaurants[index],
      };
      json.push(resultobject);
    }
    return json;
  }

  mergeJsonProperties(posts, users, restaurants) {

    let result = posts.map( post => {
      let targetuser, targetrestaurant;
      for (const [index, user] of users.entries()) {
        if (post.user_id == user.user_id) {
          targetuser = user
          break
        }
      }
      for (const [index, restaurant] of restaurants.entries()) {
        if (post.restaurant_id == restaurant.restaurant_id) {
          targetrestaurant = restaurant
          break
        }
      }
      let json = {
        ...post,
        ...targetrestaurant,
        ...targetuser
      }
      return json
    })
    return result
  }



  
}

module.exports = common_functionObject;
