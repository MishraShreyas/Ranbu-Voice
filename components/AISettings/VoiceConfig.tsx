import { useAI } from "@/components/AISettings/AIContext";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Voice } from "@cartesia/cartesia-js/api";

export default function VoiceConfig() {
    const { cartesia, voiceModel, setVoiceModel } = useAI();
    const voices = cartesia.getVoices();

    const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
    const voiceModelInfo = voices.find(voice => voice.id === voiceModel);

    const [search, setSearch] = useState("");
    const [language, setLanguage] = useState("all");

    const [page, setPage] = useState(1);
    const itemsPerPage = 5;

    // Get unique languages for filter
    const languages = useMemo(() =>
        ["all", ...new Set(voices.map(voice => voice.language))],
        [voices]
    );

    // Filter and search voices
    const filteredVoices = useMemo(() => {
        return voices.filter(voice => {
            const matchesSearch = voice.name.toLowerCase().includes(search.toLowerCase()) ||
                voice.description.toLowerCase().includes(search.toLowerCase());
            const matchesLanguage = language === "all" || voice.language === language;
            return matchesSearch && matchesLanguage;
        });
    }, [voices, search, language]);

    // Pagination
    const totalPages = Math.ceil(filteredVoices.length / itemsPerPage);
    const paginatedVoices = filteredVoices.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    return (<>
        <p className="text-lg font-semibold">Select a voice model</p>
        <div className="flex gap-2">
            <Input
                placeholder="Search voices or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    {languages.map(lang => (
                        <SelectItem key={lang} value={lang}>
                            {lang}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
            {/* Left Column - List */}
            <div className="space-y-4 row-start-2 md:row-start-1">

                <div className="space-y-2">
                    {paginatedVoices.map(voice => (
                        <Card
                            key={voice.id}
                            className={`cursor-pointer ${selectedVoice?.id === voice.id ? 'border-primary' : ''}`}
                            onClick={() => setSelectedVoice(voice)}
                        >
                            <CardHeader>
                                <CardTitle>{voice.name}</CardTitle>
                                <CardDescription>{voice.language}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="py-2">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-4">
                {voiceModelInfo && (
                    <Card className="bg-primary/10">
                        <CardHeader>
                            <CardTitle>
                                Currently Selected
                            </CardTitle>
                            <CardDescription className="mt-2">
                                <p className="font-bold">{voiceModelInfo.name}</p>
                                <p>
                                    <strong>Language:</strong>{" "}
                                    {voiceModelInfo.language}
                                </p>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {voiceModelInfo.description}
                            </p>
                        </CardContent>
                    </Card>
                )}
                {selectedVoice && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Currently Viewing
                            </CardTitle>
                            <CardDescription className="mt-2">
                                <p className="font-bold">{selectedVoice.name}</p>
                                <p>
                                    <strong>Language:</strong>{" "}
                                    {selectedVoice.language}
                                </p>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {selectedVoice.description}
                            </p>
                        </CardContent>

                        <CardFooter>
                            <Button
                                onClick={() => setVoiceModel(selectedVoice.id)}
                            >
                                Select Voice
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    </>
    );
}