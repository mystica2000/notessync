import { Capacitor } from "@capacitor/core";
import { FileTransfer } from "@capacitor/file-transfer";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";

// Custom Web Cache like API but for android/ios app
export class FilesystemCache {
    public async match(request: string) {
        console.log("Request ", request);

        try {
            const fileName = request.split("/").pop() || request;
            console.log(fileName);
            const result = await Preferences.get({ key: fileName });

            if (!result.value) {
                console.log("❌ No cache entry for:", request);
                return undefined;
            }

            const filePath = result.value;

            const fileExists = await Filesystem.stat({
                path: filePath,
                directory: Directory.Data
            }).catch(() => null);

            if (!fileExists) {
                console.log("❌ Cached file missing, cleaning up preference");
                await Preferences.remove({ key: request });
                return undefined;
            }

            const urlSafePath = Capacitor.convertFileSrc(fileExists.uri);
            const blob = await fetch(urlSafePath).then(r => r.blob()).then(r => r.arrayBuffer());

            const response = new Response(blob, {
                status: 200,
            })

            return response;
        } catch (e) {
            console.error("Match error:", e);
            return undefined;
        }

    }

    public async put(request: string, options: any) {
        console.log('💾 PUT called with:');
        console.log('  Request:', request);
        console.log('  options:', options);

        try {

            const url = new URL(request);
            const path = url.pathname.split('/').pop() || "";

            // get URI to store there on the path
            const fileInfo = await Filesystem.getUri({
                directory: Directory.Data,
                path: path
            });

            await FileTransfer.downloadFile({
                url: request, // Assuming this was meant to be passed in
                path: fileInfo.uri,
            });

            await Preferences.set({
                key: path,
                value: path
            });

        } catch (error) {
            console.error('Error downloading model files:', error);
            throw error; // Re-throw to allow caller to handle
        }
    }

}