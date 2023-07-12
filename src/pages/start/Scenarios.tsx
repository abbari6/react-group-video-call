import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./scenarios.css";
import axios from "axios";

type scenario = {
  id: number;
  name: string;
};

export const Scenarios: FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<scenario[]>([]);

  // const host = 'http://128.199.25.163:3001'
  const host = "http://localhost:3001";

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await axios.get(`${host}/api/scenarios`);
        setScenarios(response.data);
      } catch (error) {
        console.error("Error fetching scenarios:", error);
      }
    };

    fetchScenarios();
  }, []);

  const handleJoinRoom = (roomId: number) => {
    const token = localStorage.getItem("token");
    navigate(`/room/${roomId}`);

    if (!token) {
      console.error("Token not found");
      return;
    }
  };
  return (
    <>
      <div className="scenario-container">
        <h2>Available Scenario Rooms</h2>

        {scenarios.map((scenario, index) => (
          <li key={index} className="chat-room-item">
            <span>{scenario.name}</span>
            <button
              className="join-button"
              onClick={() => handleJoinRoom(scenario.id)}
            >
              Join
            </button>
          </li>
        ))}
      </div>
    </>
  );
};
