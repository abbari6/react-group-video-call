import React, { FC } from "react"
import { useNavigate } from "react-router-dom"
import './scenarios.css'

export const Scenarios: FC = () => {
  const navigate = useNavigate();
  // Example list of available chat rooms
  const chatRooms = [
    { id: 1, name: 'General Chat' },
    { id: 2, name: 'Tech Discussion' },
    { id: 3, name: 'Music Lovers' },
    { id: 4, name: 'Movie Buffs' },
  ];
  const handleJoinRoom = (roomId: number) => {
    const token = localStorage.getItem('token');
    navigate(`/room/${roomId}`)

    if (!token) {
      console.error('Token not found');
      return;
    }
  };
  return (
    <>
    <div className="scenario-container">
    <h2>Available Chat Rooms</h2>

       {chatRooms.map((room) => (
          <li key={room.id} className="chat-room-item">
            <span>{room.name}</span>
            <button className="join-button" 
             onClick={() => handleJoinRoom(room.id)}>Join</button>
          </li>
        ))}
            </div>

    </>
  )
}
