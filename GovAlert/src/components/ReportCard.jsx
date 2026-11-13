import React from "react";
import { fileUrl } from "../auth";
import { NEXT_STEP, STATUS_STYLE, formatINR, placeOf, progressOf, statusOf } from "../status";

// One report with its status, progress, proofs, government response and funds
function ReportCard({ report }) {
  const status = statusOf(report);
  const proofs = report.proofs?.length ? report.proofs : [report.proof].filter(Boolean);
  const fund = report.fund || {};
  const progress = progressOf(status);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-left flex flex-col">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <h4 className="text-lg font-semibold text-blue-300">#{report.queryNumber}</h4>
        <span className={`text-xs font-semibold py-1 px-2 uppercase rounded-full ${STATUS_STYLE[status]}`}>{status}</span>
      </div>

      <p className="text-gray-200 mb-2">{report.description}</p>
      <p className="text-gray-400 text-sm">
        <i className="fa-solid fa-location-dot mr-1"></i>{placeOf(report)}
        {report.location?.lat != null && (
          <a className="text-blue-400 hover:underline ml-2" target="_blank" rel="noreferrer"
             href={`https://www.openstreetmap.org/?mlat=${report.location.lat}&mlon=${report.location.lng}#map=17/${report.location.lat}/${report.location.lng}`}>
            View on map
          </a>
        )}
      </p>
      <p className="text-gray-500 text-sm mb-3">
        Submitted {new Date(report.createdAt).toLocaleDateString("en-IN")}
        {report.submittedBy?.username ? ` by ${report.submittedBy.username}` : ""}
      </p>

      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Progress</span><span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className={`h-2 rounded-full ${status === "Rejected" ? "bg-red-500" : "bg-green-500"}`}
               style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Next step: <span className="text-green-400 font-semibold">{NEXT_STEP[status]}</span>
        </p>
      </div>

      {proofs.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm mb-3">
          {proofs.map((p, i) => (
            <a key={p} href={fileUrl(p)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
              <i className="fa-solid fa-paperclip mr-1"></i>Proof {proofs.length > 1 ? i + 1 : ""}
            </a>
          ))}
          {report.responseProof && (
            <a href={fileUrl(report.responseProof)} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">
              <i className="fa-solid fa-circle-check mr-1"></i>Government proof of work
            </a>
          )}
        </div>
      )}

      {fund.allocated > 0 && (
        <p className="text-gray-400 text-sm mb-3">
          <i className="fa-solid fa-indian-rupee-sign mr-1"></i>
          Funds: {formatINR(fund.utilized)} used of {formatINR(fund.allocated)} allocated
        </p>
      )}

      <h5 className="text-sm font-semibold text-blue-300 mb-1">Updates</h5>
      {report.statusUpdates?.length ? (
        <ul className="text-gray-400 text-sm list-disc list-inside space-y-1">
          {report.statusUpdates.map((u, i) => <li key={i}>{u}</li>)}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">No updates yet.</p>
      )}
    </div>
  );
}

export default ReportCard;
