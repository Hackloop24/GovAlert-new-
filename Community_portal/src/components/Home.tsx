import { useState } from "react";
import Leftbar from "./Leftbar";
import Rightbar from "./Rightbar";

type SearchProp = {
  search: any;
};

const Home = (props: SearchProp) => {
  const [menu, setMenu] = useState("");

  return (
    <div className="min-h-screen w-screen bg-gray-700 text-black grid grid-cols-6">
      {/* Left Sidebar */}
      <div className="bg-gray-700 shadow-md col-span-1">
        <Leftbar setMenu={setMenu} />
      </div>

      {/* Right Sidebar */}
      <div className="col-span-5 bg-gray-700 shadow-lg rounded-lg p-6 m-4">
        <Rightbar search={props?.search} menu={menu} />
      </div>
    </div>
  );
};

export default Home;
