import { formatDate } from "../helpers/helper.js";

class User {
  constructor(userUID, firstName, lastName) {
    this.userUID = userUID;
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = null;
    this.city = null;
    this.role = "user";
    this.isOnRoom = null;
    this.xp = 0;
    this.avatarURL = process.env.USER_AVATAR_LEVEL_1;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  toObject() {
    return {
      userUID: this.userUID,
      firstName: this.firstName,
      lastName: this.lastName,
      age: this.age,
      city: this.city,
      role: this.role,
      isOnRoom: this.isOnRoom,
      xp: this.xp,
      avatarURL: this.avatarURL,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static getProfile(doc) {
    const data = doc.data();
    const user = new User(data.userUID, data.firstName, data.lastName);
    user.id = doc.id;
    user.age = data.age;
    user.city = data.city;
    user.role = data.role;
    user.isOnRoom = data.isOnRoom;
    user.xp = data.xp;
    user.avatarURL = data.avatarURL;
    user.password = undefined;
    user.createdAt = formatDate(data.createdAt);
    user.updatedAt = formatDate(data.updatedAt);
    return user;
  }
}

export default User;
