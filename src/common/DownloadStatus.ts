export class PartStatus {
    p: number;
    title: string;
    done: boolean;
    failed: boolean;
    progress: number;
    quality: string;
    curr: string;
    total: string;
}

export class VideoStatus {
    aid: number;
    title: string;
    pic: string;
    parts: PartStatus[];
    done: boolean;
    failed: boolean;
}

export class DownloadStatus {
    message: string;
    queue: VideoStatus[];
    current: VideoStatus;
    done: VideoStatus[];
    failed: VideoStatus[];
}