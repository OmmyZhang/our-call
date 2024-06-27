import {
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useState, useEffect, useRef } from "react";
import { gen_app_id } from "./tools";

import "./styles.css";

const MAX_W = 400;
const MAX_H = 400;

export const Basics = () => {
  const [calling, setCalling] = useState(false);
  const isConnected = useIsConnected();
  const [appId, setAppId] = useState("");
  const [channel, setChannel] = useState("123");

  const realAppId = calling ? gen_app_id(appId) : "";

  useJoin({ appid: realAppId, channel: channel, token: null }, calling);
  //local user
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  usePublish([localMicrophoneTrack, localCameraTrack]);
  //remote users
  const remoteUsers = useRemoteUsers();

  const [videoSizeDict, setVideosSizeDict] = useState<{ [Key: string | number]: [number, number] }>({});

  // FIXME: 这么写仍然不能setVideosSizeDict的时候触发渲染
  const cbSaver = useRef(() => { });
  cbSaver.current = () => {
    console.log(videoSizeDict);

    // FIXME
    const stats = localCameraTrack?.getStats();
    console.log(localCameraTrack, stats);
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
  const [localWidth, localHeight] = localVideoSize ? localVideoSize : [MAX_W, MAX_H];

  return (
    <>
      <div className="room">
        {isConnected ? (
          <div className="user-list">
            <div className="user" style={{ width: localWidth, height: localHeight }}>
              <LocalUser
                audioTrack={localMicrophoneTrack}
                cameraOn={cameraOn}
                micOn={micOn}
                videoTrack={localCameraTrack}
                cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
              >
                <samp className="user-name">You</samp>
              </LocalUser>
            </div>
            {remoteUsers.map((user) => {
              const videoSize = videoSizeDict[user.uid];
              const [width, height] = videoSize ? videoSize : [MAX_W, MAX_H];
              return (
                <div className="user" key={user.uid} style={{ width, height }}>
                  <RemoteUser cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg" user={user}>
                    {/*<samp className="user-name">{user.uid}</samp>*/}
                  </RemoteUser>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="join-room">
            <input
              onChange={e => setChannel(e.target.value)}
              placeholder="<Your channel Name>"
              value={channel}
            />
            <input
              onChange={e => setAppId(e.target.value)}
              placeholder="芝麻开门!"
              value={appId}
            />
            <button
              className={`join-channel ${!appId || !channel ? "disabled" : ""}`}
              disabled={!appId || !channel}
              onClick={() => setCalling(true)}
            >
              <span>Join Channel</span>
            </button>
          </div>
        )}
      </div>
      {isConnected && (
        <div className="control">
          <div className="left-control">
            <button className="btn" onClick={() => setMic(a => !a)}>
              <i className={`i-microphone ${!micOn ? "off" : ""}`} />
            </button>
            <button className="btn" onClick={() => setCamera(a => !a)}>
              <i className={`i-camera ${!cameraOn ? "off" : ""}`} />
            </button>
          </div>
          <button
            className={`btn btn-phone ${calling ? "btn-phone-active" : ""}`}
            onClick={() => setCalling(a => !a)}
          >
            {calling ? <i className="i-phone-hangup" /> : <i className="i-mdi-phone" />}
          </button>
        </div>
      )}
    </>
  );
};

export default Basics;

