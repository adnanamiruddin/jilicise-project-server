class HandPose {
  constructor(name, imageURL, leftHand, rightHand, typeOfHandPoseId) {
    this.name = name;
    this.imageURL = imageURL;
    this.leftHand = leftHand;
    this.rightHand = rightHand;
    this.typeOfHandPoseId = typeOfHandPoseId;
  }

  toObject() {
    return {
      name: this.name,
      imageURL: this.imageURL,
      leftHand: this.leftHand,
      rightHand: this.rightHand,
      typeOfHandPoseId: this.typeOfHandPoseId,
    };
  }

  static toFormattedObject(doc) {
    const data = doc.data();
    const handPose = new HandPose(
      data.name,
      data.imageURL,
      data.leftHand,
      data.rightHand,
      data.typeOfHandPoseId
    );
    handPose.id = doc.id;
    return handPose;
  }
}

export default HandPose;
