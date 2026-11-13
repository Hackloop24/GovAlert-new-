import Avatar from "react-avatar";
import { storage } from "../firebase/setup";
import account from "../assets/account.png";
import { collection, doc, getDocs } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Answers = () => {
  const location = useLocation();
  console.log(location);

  const [answerData, setAnswerData] = useState<any>([]);

  const answerDoc = doc(
    storage,
    "questions",
    `${location?.state?.id ? location?.state?.id : Math.random()}`
  );
  const answerRef = collection(answerDoc, "answers");

  const getAnswer = async () => {
    try {
      const data = await getDocs(answerRef);
      const filteredData = data?.docs?.map((doc: any) => ({
        ...doc?.data(),
        id: doc?.id,
      }));
      setAnswerData(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getAnswer();
  }, []);

  console.log(answerData);

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {answerData?.map((data: any) => {
        return (
          <div
            key={data.id}
            className="bg-gray-200 p-4 m-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              {data?.email ? (
                <Avatar
                  round
                  size="35"
                  className="mt-0.5 ml-1 cursor-pointer"
                  name={data.email ?? account}
                />
              ) : (
                <Avatar
                  round
                  size="25"
                  className="mt-0.5 ml-1 cursor-pointer"
                  src={account}
                />
              )}
              <h1 className="ml-4 font-semibold text-blue-800">
                {data?.email.substring(0, data.email.indexOf("@"))}
              </h1>
            </div>
            <h1 className="mt-3 text-gray-800 text-lg ml-2">{data?.ans}</h1>
          </div>
        );
      })}
    </div>
  );
};

export default Answers;
