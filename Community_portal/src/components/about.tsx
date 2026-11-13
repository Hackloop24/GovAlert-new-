const AboutUs = () => {
    return (
        <div className="bg-gray-900 p-8 min-h-screen">
            <div className="max-w-4xl mx-auto mb-4">
                <button
                    onClick={() => window.history.back()}
                    className="text-gray-300 hover:text-blue-400"
                >
                    <i className="fa fa-arrow-left"></i> Back
                </button>
            </div>
            <div className="max-w-4xl mx-auto bg-gray-800 shadow-lg rounded-lg p-6">
                <h1 className="text-4xl font-bold text-center text-blue-400 mb-4">About Us</h1>
                <p className="text-gray-300 leading-relaxed mb-6">
                    Welcome to our open platform, a dedicated space for residents to voice their concerns and report problems in their localities. Our mission is to empower citizens by providing a transparent and efficient way to communicate issues that need attention from local authorities.
                </p>
                <h2 className="text-2xl font-semibold text-gray-200 mb-3">How It Works</h2>
                <p className="text-gray-300 leading-relaxed">
                    Residents can easily upload problems along with supporting evidence, such as photos or documents. When submitting a report, users must provide additional details including:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-6">
                    <li>State</li>
                    <li>District</li>
                    <li>Taluk</li>
                    <li>Panchayat/Municipal Corporation</li>
                    <li>Pin Code</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-6">
                    This information helps authorities quickly locate and address the issues in specific areas.
                </p>

                <h2 className="text-2xl font-semibold text-gray-200 mb-3">Transparency and Accountability</h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                    Our platform ensures that all reported issues are visible to anyone using the service. This transparency holds authorities accountable and encourages them to respond promptly to the concerns of residents.
                </p>

                <h2 className="text-2xl font-semibold text-gray-200 mb-3">Response and Resolution</h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                    Once authorities address a reported problem, they can respond to the complainant with proof of resolution. This creates a feedback loop that fosters trust and collaboration between residents and local governance.
                </p>

                <h2 className="text-2xl font-semibold text-gray-200 mb-3">Funding Transparency</h2>
                <p className="text-gray-300 leading-relaxed">
                    Our platform also tracks the allocation of funds for resolving reported issues. Users can view:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-6">
                    <li>The amount of funding allocated to each problem</li>
                    <li>How the funds are being utilized</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-6">
                    This feature promotes financial transparency and ensures that resources are being used effectively to address community concerns.
                </p>

                <h2 className="text-2xl font-semibold text-gray-200 mb-3">Contact Us</h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                    If you have any questions or need further information, feel free to reach out to us at 
                    <a href="mailto:techtribegov@gmail.com" className="text-blue-400 hover:underline ml-1">techtribegov@gmail.com</a>.
                </p>
            </div>
        </div>
    );
};

export default AboutUs;
