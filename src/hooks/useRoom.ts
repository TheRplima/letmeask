import { useEffect, useState } from "react";

import { database, ref, onValue } from "../services/firebase";
import { useAuth } from "./useAuth";

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
    likes: Record<string, {
      authorId: string;
    }>;
  }
>;

type QuestionType = {
  id: string;
  author: Author;
  content: string;
  isHighlighted: boolean;
  isAnswered: boolean;
  likeCount: number;
  likeId: string | undefined;
};

export function useRoom(roomId: string) {
    const { user } = useAuth();
    const [questions, setQuestions] = useState<QuestionType[]>([]);
    const [title, setTitle] = useState("");
    const [roomAuthorId, setRoomAuthorId] = useState('');

    useEffect(() => {
        const roomRef = ref(database, `rooms/${roomId}`);

        const unsubscribeRoomListener = onValue(
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
                        likeCount: Object.values(value.likes ?? {}).length,
                        likeId: Object.entries(value.likes ?? {}).find(([key, like]) => like.authorId === user?.id)?.[0]
                    };
                    }
                );

                setRoomAuthorId(databaseRoom.authorId);
                setTitle(databaseRoom.title);
                setQuestions(parsedQuestions);
            },
            {
            onlyOnce: false,
            }
        );

      return () => {
        unsubscribeRoomListener();
      };
    }, [roomId,user?.id]);

    return {questions,title, roomAuthorId};
}