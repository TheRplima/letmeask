import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Button } from "../components/Button";
import { RoomCode } from "../components/RoomCode";

import { database, ref, set, get } from "../services/firebase";
import { useAuth } from "../hooks/useAuth";

import { v4 as uuidv4 } from "uuid";

import logoImg from "../assets/images/logo.svg";
import "../styles/room.scss";
import { onValue } from "firebase/database";

type Author = {
  name: string;
  avatar: string;
};

type FirebaseQuestions = Record<
  string,
  {
    author: Author;
    content: string;
    isHighlighted: boolean;
    isAnswered: boolean;
  }
>;

type Question = {
  id: string;
  author: Author;
  content: string;
  isHighlighted: boolean;
  isAnswered: boolean;
};

type RoomParams = {
  id: string;
};

export function Room() {
  const { user } = useAuth();
  const params = useParams<RoomParams>();
  const [newQuestion, setNewQuestion] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");

  const roomId = params.id || "";
  const questionId = uuidv4().split("-")[0];

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomId}`);

    onValue(
      roomRef,
      (snapshot) => {
        const databaseRoom = snapshot.val();
        const firebaseQuestions: FirebaseQuestions =
          databaseRoom.questions ?? {};
        const parsedQuestions = Object.entries(firebaseQuestions).map(
          ([key, value]) => {
            return {
              id: key,
              author: value.author,
              content: value.content,
              isHighlighted: value.isHighlighted,
              isAnswered: value.isAnswered,
            };
          }
        );

        setTitle(databaseRoom.title);
        setQuestions(parsedQuestions);
      },
      {
        onlyOnce: false,
      }
    );
  }, [roomId]);

  async function handleSendQuestion(event: FormEvent) {
    event.preventDefault();

    if (newQuestion.trim() === "") {
      return;
    }

    if (!user) {
      throw new Error("You must be logged in to send new questions.");
    }

    const roomRef = ref(database, `rooms/${roomId}/questions/${questionId}`);

    await set(roomRef, {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar,
      },
      isHighlighted: false,
      isAnswered: false,
    });

    setNewQuestion("");
  }

  return (
    <div id="page-room">
      <header>
        <div className="content">
          <img src={logoImg} alt="Letmeask" />
          <RoomCode code={roomId} />
        </div>
      </header>
      <main className="content">
        <div className="room-title">
          <h1>Sala {title}</h1>
          {questions.length > 0 && <span>{questions.length} pergunta(s)</span>}
        </div>

        <form onSubmit={handleSendQuestion}>
          <textarea
            placeholder="O que você quer perguntar?"
            onChange={(event) => setNewQuestion(event.target.value)}
            value={newQuestion}
          />

          <div className="form-footer">
            {user ? (
              <div className="user-info">
                <img src={user.avatar} alt={user.name} />
                <span>{user.name}</span>
              </div>
            ) : (
              <span>
                Para enviar uma pergunta, <button>faça seu login</button>.
              </span>
            )}
            <Button type="submit" disabled={!user}>
              Enviar pergunta
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
