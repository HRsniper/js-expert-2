const recordClick = function (recorderBtn) {
  this.recordingEnabled = false;
  return () => {
    this.recordingEnabled = !this.recordingEnabled;
    recorderBtn.style.color = this.recordingEnabled ? "red" : "white";
  };
};

const onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get("room");
  console.log("this is the room: ", room);

  // const recorderBtn = document.getElementById("record");
  // recorderBtn.addEventListener("click", recordClick(recorderBtn));

  const view = new View();
  const media = new Media();
  const dependencies = { room, media, view };
  Business.initialize(dependencies);
  // view.renderVideo({
  //   userId: "test",
  //   isCurrentUser: true,
  //   url: "https://i.giphy.com/media/26tn33aiTi1jkl6H6/giphy.mp4"
  // });
  // view.renderVideo({ userId: "test", url: "https://i.giphy.com/media/26tn33aiTi1jkl6H6/giphy.mp4" });
};

window.onload = onload;
