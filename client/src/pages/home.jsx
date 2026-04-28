import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function HomePage({ onStartDemo }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => {
      onStartDemo?.();
      navigate("/overview");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-20 text-center">
          {/* <div className="mb-6 rounded-full framer-frosted px-4 py-2 font-medium text-sm text-[#0099ff]">
            AI-Powered Logistics
          </div> */}
          <h1 className="mb-6 font-[500] text-[110px] leading-[0.85] tracking-[-5.5px] text-white font-[GT_Walsheim]">
            Logistics
            <span className="block text-[#0099ff]">Control Tower</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-[#a6a6a6] leading-relaxed">
            AI-powered route optimization for logistics operations.
            Real-time disruption detection and smart recommendations.
          </p>
        </div>

        <div className="mb-20 grid gap-6 md:grid-cols-3">
          <div className="rounded-[15px] bg-[#090909] p-8 framer-ring">
            <h3 className="mb-3 font-[500] text-[24px] text-white tracking-[-1px]">
              Smart Routing
            </h3>
            <p className="text-[15px] text-[#a6a6a6] leading-relaxed">
              AI analyzes constraints, policies, and disruptions to recommend
              optimal routes for shipments.
            </p>
          </div>

          <div className="rounded-[15px] bg-[#090909] p-8 framer-ring">
            <h3 className="mb-3 font-[500] text-[24px] text-white tracking-[-1px]">
              Disruption Detection
            </h3>
            <p className="text-[15px] text-[#a6a6a6] leading-relaxed">
              Real-time monitoring of weather, traffic, and operational events
              across Indian cities.
            </p>
          </div>

          <div className="rounded-[15px] bg-[#090909] p-8 framer-ring">
            <h3 className="mb-3 font-[500] text-[24px] text-white tracking-[-1px]">
              Policy Compliance
            </h3>
            <p className="text-[15px] text-[#a6a6a6] leading-relaxed">
              Temperature control, regulatory routes, and SLA rules enforced
              automatically.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            className="inline-flex items-center gap-3 rounded-[100px] bg-white px-10 py-4 font-[500] text-[18px] text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,153,255,0.3)] disabled:opacity-50"
            disabled={loading}
            onClick={handleStart}
            type="button"
          >
            {loading ? "Loading..." : "Launch Control Tower"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;