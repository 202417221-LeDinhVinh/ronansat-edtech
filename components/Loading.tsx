// animation spin + text

import { Spin } from "antd";

export default function Loading() {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
            <Spin size="large" />    
            <p className="text-slate-500 font-medium mt-4">Loading tests...</p>
        </div>
    );
}
