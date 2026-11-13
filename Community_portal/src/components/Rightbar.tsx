import Avatar from "react-avatar";
import account from "../assets/account.png";
import { auth, storage } from "../firebase/setup";
// import pen from "../assets/pen.png";
// import paper from "../assets/paper.jpg"
import { addDoc, collection, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import comment from "../assets/comment.png";
import { Link } from "react-router-dom";
import PostPopup from "./PostPopup";

type searchProp = {
  search: any;
  menu: any;
};

const Rightbar = (props: searchProp) => {
  const questionRef = collection(storage, "questions");
  const [questionData, setQuestionData] = useState<any>([]);
  const [commentToggle, setCommentToggle] = useState(false);
  const [questionId, setQuestionId] = useState("");
  const [answers, setAnswers] = useState("");
  const [post, setPost] = useState(false);

  const getQuestion = async () => {
    try {
      const data = await getDocs(questionRef);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setQuestionData(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  const answerDoc = doc(storage, "questions", `${questionId ? questionId : Math.random()}`);
  const answerRef = collection(answerDoc, "answers");

  const addAnswer = async () => {
    try {
      await addDoc(answerRef, {
        ans: answers,
        email: auth?.currentUser?.email,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getQuestion();
  }, [questionData]);

  return (
    <div className="p-4 rounded-sm bg-gray-100">
      <div className="bg-blue-300 p-2 h-20 border border-spacing-1 rounded-lg shadow-md">
        <div className="flex">
          {auth?.currentUser?.emailVerified ? (
            <Avatar round size="25" className="mt-0.5 ml-1 cursor-pointer" name={auth?.currentUser?.email ?? account} />
          ) : (
            <Avatar round size="25" className="mt-0.5 ml-1 cursor-pointer" src={account} />
          )}
          <input
            onClick={() => setPost(true)}
            placeholder="What do you want to ask or share?"
            className="bg-white text-gray-700 p-2 ml-4 placeholder-gray-500 border border-spacing-1 rounded-full w-full cursor-pointer"
          />
        </div>
      </div>

      {questionData
        .filter((data: any) => (props?.search ? data?.question.includes(props?.search) : data?.question?.includes(props?.menu)))
        .map((data: any) => {
          return (
            <>
              <div className="bg-white mt-2 p-2 rounded-lg shadow-md border-t-2 border-blue-300">
                <div className="flex">
                  {auth?.currentUser?.emailVerified ? (
                    <Avatar round size="25" className="mt-0.5 ml-1 cursor-pointer" name={data?.email ?? account} />
                  ) : (
                    <Avatar round size="25" className="mt-0.5 ml-1 cursor-pointer" src={account} />
                  )}
                  <h1 className="ml-3 font-semibold">{data?.email.substring(0, data.email.indexOf("@"))}</h1>
                </div>
                <h1 className="mt-4 ml-2 font-bold text-gray-800">{data?.question}?</h1>
                <hr className="mt-3 border-gray-300" />
                <div className="flex">
                  <img
                    src={comment}
                    onClick={() => {
                      setQuestionId(data?.id);
                      setCommentToggle(true);
                    }}
                    className="w-5 h-5 mt-3 cursor-pointer ml-3"
                  />
                  <Link to="/answers" state={{ id: data?.id }}>
                    <button className="bg-blue-500  hover:bg-blue-600 text-white rounded-full p-2 mt-2 ml-3">View Comments</button>
                  </Link>
                </div>
                {commentToggle && (
                  <div className="flex mt-3">
                    {auth?.currentUser?.emailVerified ? (
                      <Avatar round size="35" className="mt-0.5 ml-1 cursor-pointer" name={auth?.currentUser?.email ?? account} />
                    ) : (
                      <Avatar round size="25" className="mt-0.5 ml-1 cursor-pointer" src={account} />
                    )}
                    <input
                      onChange={(e) => setAnswers(e.target.value)}
                      placeholder="Add a comment"
                      className="bg-gray-200 text-gray-700 p-1 ml-4  placeholder-gray-500 border border-spacing-1 rounded-full w-full h-10"
                    />
                    <Link to="/answers" state={{ id: data?.id }}>
                      <button
                        onClick={() => {
                          addAnswer();
                          setCommentToggle(false);
                        }}
                        className="bg-blue-500 text-white rounded-full p-2 w-60 ml-3 hover:bg-blue-600"
                      >
                        Add comment
                      </button>
                    </Link>
                  </div>
                )}
                <hr className="mt-4 border-gray-300" />
              </div>
            </>
          );
        })}
      {post && <PostPopup setPost={setPost} />}
    </div>
  );
};

export default Rightbar;
