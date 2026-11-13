import { addDoc, collection } from "firebase/firestore";
import { auth, storage } from "../firebase/setup";
import { useState } from "react";

type postType = {
  setPost: any; // Function to toggle the popup visibility
};

const PostPopup = (props: postType) => {
  const questionRef = collection(storage, "questions");
  const [quest, setQuest] = useState("");

  const addQuestion = async () => {
    try {
      await addDoc(questionRef, {
        question: quest,
        email: auth?.currentUser?.email,
      });
      props?.setPost(false);
    } catch (error) {
      console.error("Error adding question: ", error);
    }
  };

  return (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-zinc-950 bg-opacity-80 transition-opacity"></div>

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:items-start">
                <h1
                  onClick={() => props?.setPost(false)}
                  className="cursor-pointer text-black"
                >
                  X
                </h1>
                
                {/* Use textarea instead of input */}
                <textarea
                  onChange={(e) => setQuest(e.target.value)}
                  value={quest}
                  placeholder="Start your question with Why, What, How, etc."
                  className="w-full outline-none h-30 border p-2 rounded-md text-black resize-none"
                  rows={4} // Adjust number of rows (lines) based on preference
                />
                
                <button
                  onClick={addQuestion}
                  className="bg-blue-500 text-white rounded-full p-2 w-40 ml-auto mt-3 block"
                >
                  Add question
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPopup;
