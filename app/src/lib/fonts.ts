export interface LocalFontData {
    family: string;
    fullName: string;
    postscriptName: string;
    style: string;
}

export async function queryLocalFonts(): Promise<LocalFontData[] | string> {
    let data: LocalFontData[] | string = [];
    if (typeof window == "undefined") return data;

    try {
        const status = await (navigator as any).permissions.query({
            name: "local-fonts",
        });

        if (status.state == "denied")
            throw new Error("Permission to access local fonts was denied.");

        if (status.state == "granted" || status.state == "prompt") {
            if ("queryLocalFonts" in window) {
                data = await (window as any).queryLocalFonts();
            } else {
                throw new Error(
                    "Your browser does not support the Local Font Access API.",
                );
            }
        }
    } catch (err: any) {
        console.error("Failed to fetch local fonts:", err);
        alert(err.message);
        data = err.message;
    } finally {
        console.log(data);
        return data;
    }
}

export async function getFontFamilys(): Promise<string[]> {
    const fontData = await queryLocalFonts();

    if (!Array.isArray(fontData)) return [];
    return fontData.reduce<string[]>((acc, f) => {
        if (!acc.includes(f["family"])) acc.push(f["family"]);

        return acc;
    }, []);
}
