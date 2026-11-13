import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { COMMUNITY_URL, getSession } from "../auth";
import { useToast } from "./Toaster";

// The six feature cards on the home pages. Cards marked `needsLogin`
// send signed-out visitors to the Sign In page first.
const CARDS = [
  {
    to: "/report",
    icon: "fa-bullhorn",
    title: "Report Issues",
    text: "Submit reports about local issues, attach photos, and provide descriptions.",
    needsLogin: true,
  },
  {
    to: "/map",
    icon: "fa-map-location-dot",
    title: "Map Issues",
    text: "View reported issues on a map and trace the issues.",
  },
  {
    to: "/responses",
    icon: "fa-comments",
    title: "Government Response",
    text: "Local government officials respond to reports and update their status.",
  },
  {
    to: "/track",
    icon: "fa-list-check",
    title: "View Reports and Progress",
    text: "Track the progress of the reports you have submitted on the portal.",
    needsLogin: true,
  },
  {
    href: COMMUNITY_URL,
    icon: "fa-users",
    title: "Community Engagement",
    text: "Community chat for discussion of problems and possible solutions.",
  },
  {
    to: "/transparency",
    icon: "fa-shield-halved",
    title: "Transparency",
    text: "See how many issues are resolved and how allocated funds are being used.",
  },
];

const cardClass =
  "bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition duration-300 flex flex-col items-center text-center cursor-pointer";

function CardBody({ icon, title, text, locked }) {
  return (
    <>
      <i className={`fa-solid ${icon} text-blue-400 text-3xl mb-4`}></i>
      <h3 className="text-xl font-semibold text-blue-300 mb-2">{title}</h3>
      <p className="text-gray-400 text-base">{text}</p>
      {locked && (
        <p className="text-gray-500 text-sm mt-3">
          <i className="fa-solid fa-lock mr-1"></i>Sign in required
        </p>
      )}
    </>
  );
}

function FeatureCards() {
  const navigate = useNavigate();
  const toast = useToast();
  const signedIn = Boolean(getSession());

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2 lg:px-16 xl:px-24 2xl:px-32">
      {CARDS.map((card) => {
        const locked = card.needsLogin && !signedIn;

        if (card.href) {
          return (
            <a key={card.title} href={card.href} className={cardClass}>
              <CardBody {...card} />
            </a>
          );
        }
        if (locked) {
          return (
            <Link
              key={card.title}
              to="/login"
              className={cardClass}
              onClick={(e) => {
                e.preventDefault();
                toast.info("Sign in required", `Please sign in or create an account to use ${card.title}.`);
                navigate("/login");
              }}
            >
              <CardBody {...card} locked />
            </Link>
          );
        }
        return (
          <Link key={card.title} to={card.to} className={cardClass}>
            <CardBody {...card} />
          </Link>
        );
      })}
    </div>
  );
}

export default FeatureCards;
