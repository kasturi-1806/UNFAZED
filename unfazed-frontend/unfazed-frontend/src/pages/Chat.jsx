import React, {useEffect,useRef,useState,} from "react";
import {useParams,Link,} from "react-router-dom";
import { io } from "socket.io-client";
function Chat() {
  const {otherUserRole,otherUserId,} = useParams();
  const [messages, setMessages] =useState([]);
  const [message, setMessage] =useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] =useState(false);
  const [error, setError] =useState("");
  const [otherUserName,setOtherUserName,] = useState("Chat");
  const socketRef =useRef(null);
  const messagesEndRef =useRef(null);
  const isValidObjectId = (id) => {
    return (
      typeof id === "string" &&
      /^[a-fA-F0-9]{24}$/.test(id)
    );
  };
  useEffect(() => {
    const token =localStorage.getItem("token");
    const userRole =localStorage.getItem("userRole");
    const storedUser =
      JSON.parse(
        localStorage.getItem("user")) || {};
    const currentUserId =
      storedUser.id ||
      storedUser._id;
    console.log("CHAT URL PARAMS:",{ otherUserRole, otherUserId,});
    console.log("CHAT CURRENT USER:", {currentUserId,userRole,} );
    if (
      !otherUserId ||
      otherUserId === "null" ||
      otherUserId === "undefined" ||
      !isValidObjectId(otherUserId)
    ) {
      console.error( "INVALID CHAT USER ID:", otherUserId );
      setError( "Unable to open chat because the therapist ID is missing." );
      setLoading(false);
      return;
    }
    if (
      !otherUserRole ||
      !["user", "therapist"].includes(
        otherUserRole
      )
    ) {
      setError( "Invalid chat user role.");
      setLoading(false);
      return;
    }
    if ( !token || !currentUserId ) {setError("Please login again.");
      setLoading(false);
      return;
    }

    const fetchConversation =
      async () => {
        try {
          setLoading(true);
          setError("");
          const response =
            await fetch(
              `https://unfazed-692q.onrender.com/api/messages/${otherUserRole}/${otherUserId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          const data =
            await response.json();
          console.log( "CHAT API STATUS:", response.status );
          console.log("CHAT API RESPONSE:", data);
          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to load conversation"
            );
          }
          setMessages(
            data.messages || []
          );
        } catch (err) {
          console.error(
            "FETCH CONVERSATION ERROR:",
            err
          );
          setError(
            err.message ||
              "Failed to load conversation."
          );
        } finally {
          setLoading(false);
        }
      };
    fetchConversation();

    const socket = io(
      "https://unfazed-692q.onrender.com",
      {
        transports: [
          "websocket",
        ],
      }
    );
    socketRef.current =
      socket;
    socket.on(
      "connect",
      () => {
        console.log( "Connected to chat:",socket.id );
        socket.emit(
          "joinRoom",
          {
            userId:
              currentUserId,
            role:
              userRole,
          }
        );
      }
    );
    socket.on(
      "newMessage",
      (newMessage) => {
        console.log( "NEW MESSAGE:", newMessage);
        if (
          String(
            newMessage.senderId
          ) ===
            String(
              otherUserId
            ) &&
          newMessage.senderRole ===
            otherUserRole
        ) {
          setMessages(
            (previousMessages) => [
              ...previousMessages,
              newMessage,
            ]
          );
        }
      }
    );
    socket.on(
      "disconnect",
      () => {
        console.log("CHAT SOCKET DISCONNECTED");
      }
    );
    return () => {
      socket.disconnect();
    };
  }, [
    otherUserId,
    otherUserRole,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  const handleSendMessage = async (e) => { e.preventDefault();
    const trimmedMessage =
      message.trim();
    if (
      !trimmedMessage ||
      sending
    ) {
      return;
    }
    if (
      !otherUserId ||
      otherUserId === "null" ||
      !isValidObjectId(
        otherUserId
      )
    ) {
      setError( "Invalid therapist ID.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      setSending(true);
      setError("");
      const response =
        await fetch(
          "https://unfazed-692q.onrender.com/api/messages",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              receiverId:
                otherUserId,
              receiverRole:
                otherUserRole,

              message:
                trimmedMessage,
            }),
          }
        );
      const data =
        await response.json();
      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to send message"
        );
      }
      setMessages(
        (previousMessages) => [
          ...previousMessages,
          data.data,
        ]
      );
      const storedUser =
        JSON.parse(
          localStorage.getItem(
            "user"
          )
        ) || {};
      const currentUserId =
        storedUser.id ||
        storedUser._id;
      const userRole =
        localStorage.getItem(
          "userRole"
        );
      if (
        socketRef.current &&
        currentUserId &&
        userRole
      ) {
        socketRef.current.emit(
          "sendMessage",
          {
            senderId:
              currentUserId,
            senderRole:
              userRole,
            receiverId:
              otherUserId,
            receiverRole:
              otherUserRole,
            message:
              trimmedMessage,
          }
        );
      }
      setMessage("");
    } catch (err) {
      console.error(
        "SEND MESSAGE ERROR:",
        err
      );
      setError(
        err.message ||
          "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  };
  if (
    otherUserId === "null" ||
    otherUserId ===
      "undefined" ||
    !isValidObjectId(
      otherUserId
    )
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "#f7f8f5",
          padding: "30px",
        }}
      >
        <div
          style={{
            maxWidth:
              "700px",
            margin:
              "80px auto",
            background:
              "#ffffff",
            padding:
              "30px",
            borderRadius:
              "18px",
            textAlign:
              "center",
            boxShadow:
              "0 8px 30px rgba(32, 61, 53, 0.08)",
          }}
        >
          <h2
            style={{
              color:
                "#203d35",
            }}
          >
            Chat unavailable
          </h2>

          <p
            style={{
              color:
                "#666",
              marginBottom:
                "20px",
            }}
          >
            The therapist ID is
            missing or invalid.
          </p>
          <Link
            to="/user-dashboard"
            style={{
              display:
                "inline-block",
              background:
                "#315f51",
              color:
                "#ffffff",
              padding:
                "12px 20px",
              borderRadius:
                "10px",
              textDecoration:
                "none",
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{ minHeight:"100vh", background:"#f7f8f5", padding: "30px",}} >
      <div
        style={{ maxWidth: "900px",margin:"0 auto", }} >
        <div
          style={{ display:"flex", justifyContent: "space-between", alignItems:"center", marginBottom: "20px", }} >
          <div>
            <p
              style={{color:"#315f51",fontWeight:"600", marginBottom: "5px", }} >UNFAZED </p>
            <h1
              style={{color: "#203d35", margin: 0, }}>
              {otherUserName}
            </h1>
            <p
              style={{ color:"#666",}}>Secure conversation </p>
          </div>
          <Link
            to={
              otherUserRole ===
              "user"
                ? "/patients"
                : "/user-dashboard"
            }
            style={{textDecoration:"none",color:"#315f51",fontWeight:"600",}} >
            Back
          </Link>
        </div>
        {error && (
          <div
            style={{ background: "#ffe5e5",color:"#a33",padding:"12px 16px", borderRadius:"10px",marginBottom: "15px",  }}  >
            {error}
          </div>
        )}
        <div
          style={{background:"#ffffff", borderRadius:"18px",padding:"20px", minHeight: "500px",display: "flex", flexDirection:   "column",boxShadow:"0 8px 30px rgba(32, 61, 53, 0.08)", }} >
          <div
            style={{ flex: 1,overflowY:"auto", padding:"10px",}} >
            {loading ? (
              <p
                style={{textAlign: "center", color:"#777",}}  >
                Loading conversation...
              </p>
            ) : messages.length ===
              0 ? (
              <p
                style={{textAlign:"center", color: "#777", marginTop: "150px",  }}>
                No messages yet.
                <br />
                Start the conversation.
              </p>
            ) : (
              messages.map(
                (
                  item,
                  index
                ) => {
                  const storedUser =
                    JSON.parse(
                      localStorage.getItem(
                        "user"
                      )
                    ) || {};
                  const currentUserId =
                    storedUser.id ||
                    storedUser._id;
                  const isMine =
                    String(
                      item.sender
                    ) ===
                    String(
                      currentUserId
                    ) ||
                    String(
                      item.senderId
                    ) ===
                    String(
                      currentUserId
                    )
                  return (
                    <div
                      key={
                        item._id ||
                        `${item.createdAt}-${index}`
                      }
                      style={{display:"flex",justifyContent: isMine ? "flex-end" : "flex-start", marginBottom:"12px",}}>
                      <div
                        style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: "14px",background: isMine?"#315f51": "#dfeae3",color:  isMine? "#ffffff": "#203d35",   }} >
                        <div>
                          { item.message }
                        </div>
                        {item.createdAt && (
                          <small
                            style={{display:"block", marginTop: "5px",opacity:0.7,fontSize:"11px",}} >
                            {new Date(
                              item.createdAt
                            ).toLocaleTimeString(
                              [],
                              { hour:"2-digit", minute: "2-digit", }
                            )}
                          </small>
                        )}
                      </div>
                    </div>
                  );
                }
              )
            )}

            <div
              ref={
                messagesEndRef
              }
            />
          </div>
          <form
            onSubmit={
              handleSendMessage
            }
            style={{ display:"flex", gap:"10px",marginTop: "15px",borderTop: "1px solid #e5e5e5", paddingTop: "15px",}} >
            <inputtype="text" value={ message} onChange={(e) =>setMessage( e.target.value ) }
              placeholder="Type a message..."
              disabled={
                sending
              }
              style={{flex: 1, padding:"12px 15px",border: "1px solid #dfeae3",borderRadius:"10px",outline: "none",fontSize:"15px", }} />
            <button
              type="submit"
              disabled={
                sending ||
                !message.trim()
              }
              style={{border: "none",borderRadius: "10px",padding:"12px 20px",background: "#315f51",color: "#ffffff", cursor:sending ? "not-allowed" : "pointer",opacity: sending || !message.trim() ? 0.6: 1, }}>
              {sending
                ? "Sending..."
                : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default Chat;
