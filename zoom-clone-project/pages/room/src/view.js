class View {
  constructor() {}

  createVideoElement({ muted = true, src, srcObject }) {
    const video = document.createElement("video");
    video.src = src;
    video.muted = muted;

    if (src) {
      video.controls = true;
      video.loop = true;

      Util.sleep(200).then((event) => {
        video.play();
      });
    }

    if (srcObject) {
      video.addEventListener("loadedmetadata", (event) => {
        video.play();
      });
    }

    return video;
  }

  renderVideo({ userId, stream = null, url = null, isCurrentUser = false }) {
    const video = this.createVideoElement({ src: url, srcObject: stream });

    this.appendToHtmlTree(userId, video, isCurrentUser);
  }

  appendToHtmlTree(userId, video, isCurrentUser) {
    const divVideo = document.createElement("div");
    divVideo.id = userId;
    divVideo.classList.add("wrapper");
    divVideo.append(video);

    const divUserName = document.createElement("div");
    divUserName.innerText = isCurrentUser ? "" : userId;
    divVideo.append(divUserName);

    const videoGrid = document.getElementById("video-grid");
    videoGrid.append(divVideo);
  }
}
