import { useAI } from "./AIContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VoiceConfig from "@/components/AISettings/VoiceConfig";

export default function AIConfig() {
    const { groq, prompt, setPrompt, model, setModel, } = useAI();

    return (
        <Card className="">
            <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="model">Chat Model</Label>
                    <Select
                        value={model}
                        onValueChange={value => setModel(value)}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a chat model" />
                        </SelectTrigger>
                        <SelectContent>
                            {groq.getModels().map((model) => (
                                <SelectItem key={model} value={model}>
                                    {model}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <VoiceConfig />

                <div className="space-y-2">
                    <Label htmlFor="prompt">System Prompt</Label>
                    <Textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter system prompt..."
                        className="min-h-[200px]"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
