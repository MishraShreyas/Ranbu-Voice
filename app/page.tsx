import Home from "@/components/App";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ranbu",
    description: "Ranbu, the voice bot.",
}

export default function Page() {
    return <Home />;
}
