import {
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useState, useEffect, useRef } from "react";
import { gen_app_id } from "./tools";
import Mao from "./assets/mao.png";
import Ji from "./assets/ji.png";
import "./styles.scss";

const MAX_MAP = {
  S: {
    W: 350,
    H: 350,
  },
  L: {
    W: 500,
    H: 500,
  }
}


const getVideoSize = () => {
  return window.innerWidth > 800 ? [MAX_MAP.L.W, MAX_MAP.L.H] : [MAX_MAP.S.W, MAX_MAP.S.H];
}

export const Basics = () => {
  const [calling, setCalling] = useState(false);
  const [appId, setAppId] = useState("");
  const [channel, setChannel] = useState("123");
  const realAppId = calling ? gen_app_id(appId) : "";
  const join = useJoin({ appid: realAppId, channel: channel, token: null }, calling);
  //local user
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  //remote users
  const remoteUsers = useRemoteUsers();

  usePublish([localMicrophoneTrack, localCameraTrack]);

  const [videoSizeDict, setVideosSizeDict] = useState<{ [Key: string | number]: [number, number] }>({});

  // FIXME: 这么写仍然不能setVideosSizeDict的时候触发渲染
  const cbSaver = useRef(() => { });
  cbSaver.current = () => {

    // console.log(videoSizeDict);
    const windowWidth = window.innerWidth;
    const MAX_W = windowWidth > 800 ? MAX_MAP.L.W : MAX_MAP.S.W;
    const MAX_H = windowWidth > 800 ? MAX_MAP.L.H : MAX_MAP.S.H;

    // FIXME
    const stats = localCameraTrack?.getStats();
    // console.log(localCameraTrack, stats);
    if (stats && stats.sendResolutionWidth) {
      let [width, height] = [stats.sendResolutionWidth, stats.sendResolutionHeight];
      if (width > MAX_W) {
        [width, height] = [MAX_W, height * MAX_W / width];
      }
      if (height > MAX_H) {
        [width, height] = [width * MAX_H / height, MAX_H];
      }
      setVideosSizeDict((prev) =>
        Object.assign(prev, { 0: [width, height] }));
    }

    remoteUsers.forEach((user) => {
      console.log("User:", user);
      const stats = user.videoTrack?.getStats();
      if (stats && stats.receiveResolutionWidth) {
        let [width, height] = [stats.receiveResolutionWidth, stats.receiveResolutionHeight];
        if (width > MAX_W) {
          [width, height] = [MAX_W, height * MAX_W / width];
        }
        if (height > MAX_H) {
          [width, height] = [width * MAX_H / height, MAX_H];
        }
        console.log(width, height);
        setVideosSizeDict((prev) => Object.assign(prev, { [user.uid]: [width, height] }));
      }
    });
  };

  useEffect(() => {
    const interval = setInterval(
      cbSaver.current
      , 500);

    //Clearing the interval
    return () => clearInterval(interval);
  }, []);


  const localVideoSize = videoSizeDict[0];
  const [localWidth, localHeight] = localVideoSize ? localVideoSize : getVideoSize();

  return (
    <div className="our-call">
      <div className="header">OUR CALL</div>

      { join.isConnected ? (
        <div className="room">
          <div className="user-list">
            <div className="user" style={ { width: localWidth, height: localHeight } }>
              <LocalUser
                audioTrack={ localMicrophoneTrack }
                cameraOn={ cameraOn }
                micOn={ micOn }
                videoTrack={ localCameraTrack }
                cover={ Ji }
              >
                <samp className="user-name">You</samp>
              </LocalUser>
            </div>
            { remoteUsers.map((user) => {
              const videoSize = videoSizeDict[user.uid];
              const [MAX_W, MAX_H] = getVideoSize();
              const [width, height] = videoSize ? videoSize : [MAX_W, MAX_H];
              return (
                <div className="user" key={ user.uid } style={ { width, height } }>
                  <RemoteUser cover={ Mao } user={ user }>
                  </RemoteUser>
                </div>
              )
            }) }
          </div>
          <div className="control">
            <div className="left-control">
              <button onClick={ () => setMic(a => !a) }>
                <i className={ `microphone ${ !micOn ? "off" : "" }` } />
              </button>
              <button onClick={ () => setCamera(a => !a) }>
                <i className={ `camera ${ !cameraOn ? "off" : "" }` } />
              </button>
            </div>
            <button
              onClick={ () => setCalling(a => !a) }
            >
              <i className={ `phone ${ !calling ? "off" : "" }` }></i>
            </button>
          </div>
        </div>

      ) : (
        <div className="join">
          <div className="input">
            <label>CHANNEL</label>
            <input
              onChange={ e => setChannel(e.target.value) }
              placeholder="Your channel Name"
              value={ channel }
            />
          </div>
          <div className="input">
            <label>KEY
            </label>
            <input
              onKeyDown={ (e) => {
                if (e.key === "Enter") {
                  setCalling(true);
                  e.stopPropagation();
                }
              } }
              onChange={ e => {
                setCalling(false);
                setAppId(e.target.value)
              } }
              placeholder="请输入密钥"
              value={ appId }
            />
          </div>
          <button
            className={ `join-channel ${ !appId || !channel ? "disabled" : "" }` }
            disabled={ !appId || !channel || calling }
            onClick={ () => setCalling(true) }
          >
            <span>    {
              !calling ? "芝麻开门！" :
                join.isLoading ? "芝麻努力开门 ing" : join.error ? "密钥有误" : "?"
            }</span>
          </button>
        </div>
      ) }
    </div>
  );
};

export default Basics;

