import Peer, { MediaConnection } from "peerjs";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import { v4 as uuid } from "uuid";
import useClipboard from "react-use-clipboard";
import { useParams } from "react-router-dom";

export const Room: FC = () => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [x2, setX2] = useState(0);
  const [y2, setY2] = useState(0);
  const { scenarioId } = useParams();
  const [tableData, setTableData] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [time, settime] = useState("");
  const [, setCopied] = useClipboard(window.location.href);

  const [peers, setPeers] = useState<{ id: string; call: MediaConnection }[]>(
    []
  );

  const userVideoRef = useRef<HTMLVideoElement>(null);

  const peer = useMemo(
    () =>
      new Peer(undefined, {
        host: "localhost",
        port: 5000,
        path: "/chatroom",
      }),
    []
  );

  const [mute, setMute] = useState(false);
  const [blind, setBlind] = useState(false);
  const token = localStorage.getItem("token");
  const url = `http://localhost:3001/scenario?scenarioId=${scenarioId}`;

  const socket = useMemo(
    () =>
      io(url, {
        transports: ["websocket"],
        withCredentials: true,
        auth: { token },
      }),
    []
  );

  useEffect(() => {
    const onOpen = (id: string): void => {
      console.log(`Peer Connection Open: ${id}`);
      const payload = { roomId: scenarioId, peerId: id };
      socket.emit("join-room", payload);
    };
    const onPeerError: (err: any) => void = (err) => {
      alert("Failed to init peer");
      console.error("[peer-js]:", err);
    };
    const onSocketConnectError = (err: Error): void => {
      alert("Failed to connect socket");
      console.error("[socket-io]:", err);
    };

    peer.on("open", onOpen);
    peer.on("error", onPeerError);
    socket.on("connect_error", onSocketConnectError);

    return () => {
      peer.off("open", onOpen);
      peer.off("error", onPeerError);
      socket.off("connect_error", onSocketConnectError);
    };
  }, []);

  useEffect(() => {
    if (userVideoRef.current) {
      navigator.mediaDevices
        .getUserMedia({
          audio: !mute,
          video: !blind
            ? {
                width: { min: 320, max: 1280 },
                height: { min: 180 },
                frameRate: 25,
                facingMode: "user",
              }
            : false,
        })
        .then((stream) => {
          // local user video stream
          if (userVideoRef?.current) userVideoRef.current.srcObject = stream;

          // if calling from another browser then answer with my stream
          peer.on("call", (call) => {
            console.log("Somebody's calling: ", call);
            call.answer(stream);
            setPeers((prev) => [...prev, { id: uuid(), call }]);
          });

          socket.on("user-connected", (userId) => {
            console.log("New user connection:", userId);
            connectToNewUser(userId, stream);
          });

          // 'stream' event is missed because it is fired before
          // the new user completes the navigator media promise.
          // When a new user connects, we are getting an userId from socket
          // and we immediately call connectToNewUser(userId, stream) without
          // waiting till the time new client finishes the promise.
          // Thus emit-listening another event to let the new user finish
          // it's navigator.mediaDevices.getUserMedia() Promise before socket
          // connection
          socket.on("new-user-connected", (userId) => {
            if (userId != peer.id) {
              console.log("new-user-connected (2): ", userId);
              connectToNewUser(userId, stream);
            }
          });
          const payload = { roomId: scenarioId, peerId: peer.id };
          socket.emit("connection-request", payload);
        });
      return () => {
        peer.destroy();
      };
    }
  }, [blind, mute]);

  useEffect(() => {
    const onUserDisconnected = (userId: string) => {
      console.log(`User disconnected ${userId}`);
      peers.find(({ id }) => id === userId)?.call.close();
      setPeers(peers.filter(({ id }) => id === userId));
    };
    socket.on("user-disconnected", onUserDisconnected);

    return () => {
      socket.off("user-disconnected", onUserDisconnected);
    };
  }, [peers]);

  const connectToNewUser = (userId: string, stream: MediaStream) => {
    const call = peer.call(userId, stream);
    setPeers((prev) => {
      // ensuring no duplicates
      prev = prev.filter(({ id }) => id !== userId);
      return [...prev, { id: userId, call }];
    });
  };

  console.table(peers);

  const btnClasses = "bg-gray-100 text-gray-800 p-2 font-semibold rounded";

  function handleDragEnd(event) {
    // This method runs when the dragging stops
    setX(event.clientX);
    setY(event.clientY);
    const x = event.clientX;
    const y = event.clientY;
    socket.emit("moveIcon", { x, y, roomId: scenarioId });
  }

  function handleDragEnd2(event) {
    // This method runs when the dragging stops
    setX2(event.clientX);
    setY2(event.clientY);
    const x = event.clientX;
    const y = event.clientY;
    socket.emit("moveIcon2", { x, y, roomId: scenarioId });
  }

  useEffect(() => {
    socket.on("moveIcon", (data) => {
      console.log(data);
      setX(data.x);
      setY(data.y);
    });

    socket.on("moveIcon2", (data) => {
      console.log(data);
      setX2(data.x);
      setY2(data.y);
    });
  }, []);

  useEffect(() => {
    socket.on("newKeyEvent", (data) => {
      setTableData((prevData) => [...prevData, data]);
    });
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    // Emit socket event with form values
    const formData = {
      name,
      bio,
      time,
    };
    const payload = {
      tableData: formData,
      roomId: scenarioId,
    };
    socket.emit("insertKeyEventData", payload);
    // Reset form fields
    setName("");
    setBio("");
    settime("");
  };

  return (
    <>
      <div className="flex flex-row justify-between p-2">
        <div className="w-8/12 px-2 flex ">
          <div
            className=""
            onDragEnd={handleDragEnd}
            style={{
              position: "absolute",
              left: x,
              top: y,
            }}
            draggable
          >
            🚀
          </div>
          <div
            className="ml-10"
            onDragEnd={handleDragEnd2}
            style={{
              position: "absolute",
              left: x2,
              top: y2,
            }}
            draggable
          >
            🌐
          </div>
        </div>
        <div className="px-5 ">
          <p className="font-semibold">
            Invite with link : {window.location.href}
          </p>
          <button className={btnClasses} onClick={setCopied}>
            Copy!
          </button>
        </div>
      </div>

      <div className="flex">
        <div
          className="playground w-7/12 h-72"
          style={{
            backgroundImage:
              "url('https://img.freepik.com/free-photo/beautiful-view-greenery-bridge-forest-perfect-background_181624-17827.jpg?w=2000')",
          }}
        ></div>
<div className="flex">
<div className="container mx-auto">
          <div className="ml-10">
            {" "}
            <h4>Key Events</h4>
          </div>
          <table className="table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Bio</th>
                <th className="px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((entry, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{entry.name}</td>
                  <td className="border px-4 py-2">{entry.bio}</td>
                  <td className="border px-4 py-2">{entry.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="container mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="bio"
              >
                Bio
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              ></textarea>
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="time"
              >
                time
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="time"
                type="text"
                value={time}
                onChange={(event) => settime(event.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
</div>
        
      </div>
      <div
        style={{ gridTemplateColumns: "repeat(auto-fill, 300px)" }}
        className="grid auto-rows-[300px] gap-1 m-2"
      >
        {!blind ? (
          <video
            ref={userVideoRef}
            autoPlay
            muted
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full object-cover rounded bg-gray-200" />
        )}
        {peers.map(({ id, call }) => (
          <Video key={id} call={call} />
        ))}
      </div>
      <section className="flex flex-col">
        <div className="absolute bottom-10 w-full space-x-2 flex justify-center">
          <button
            className={btnClasses + " bg-red-400"}
            onClick={() => setMute(!mute)}
          >
            {!mute ? "Mute" : "Unmute"}
          </button>
          <button
            className={btnClasses + " bg-red-400"}
            onClick={() => setBlind(!blind)}
          >
            {!blind ? "Blind" : "Unblind"}
          </button>
        </div>
      </section>
    </>
  );
};

interface VideoProps {
  call: MediaConnection;
}

export const Video: FC<VideoProps> = ({ call }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onCallStream = (stream: MediaStream): void => {
      console.log("Call streaming: ", stream);
      if (videoRef?.current) videoRef.current.srcObject = stream;
    };
    const onCallClose = () => {
      console.log("Call ended");
      videoRef.current?.remove();
    };

    call.on("stream", onCallStream);
    call.on("close", onCallClose);

    return () => {
      call.off("stream", onCallStream);
      call.off("close", onCallClose);
    };
  }, [call, videoRef]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover rounded"
      autoPlay
    />
  );
};
