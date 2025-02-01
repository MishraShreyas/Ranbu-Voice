import { useAI } from "@/components/AISettings/AIContext";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ChatHistory() {
    const { history } = useAI();

    return (
        <Card className="space-y-4 p-6">
            {history.current.length == 0 && (
                <div className="flex justify-center items-center">
                    <p>Start a conversation by asking a question.</p>
                </div>
            )}
            {history.current.map((message, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                    )}
                >
                    <div
                        className={cn(
                            "max-w-[80%] rounded-lg p-4",
                            message.role === "assistant" ? "bg-primary/20" :
                                message.role === "user" ? "bg-blue-500 text-white" :
                                    "bg-secondary/10",
                            message.role === "user" ? "rounded-br-none" : "rounded-bl-none"
                        )}
                    >
                        <div className={cn(
                            "text-sm",
                            message.role === "user" ? "text-white" : "text-foreground"
                        )}>
                            {message.role === "tool" ? (
                                <pre className="bg-secondary/20 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(JSON.parse(message.content), null, 2)}
                                </pre>
                            ) : message.role === "assistant" && message.tool_calls ? (
                                <pre className="bg-secondary/20 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(message.tool_calls, null, 2)}
                                </pre>
                            ) : (
                                <div className="whitespace-pre-wrap">
                                    {message.content as string}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </Card>
    );
}