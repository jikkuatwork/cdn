var _a;
export class Cupboard {
    constructor(seed, keys) {
        this.read = async () => {
            let response = {};
            if (this.keys.read) {
                response = await Cupboard.get("read", { key: this.keys.read });
                if (response.error) {
                    throw new Error("Unauthorized: Bad key");
                }
                else {
                    return response.payload;
                }
            }
            else {
                throw new Error("Unauthorized: `read` key missing");
            }
        };
        this.append = async (item) => {
            let response = {};
            if (this.keys.append) {
                response = await Cupboard.post("append", {
                    key: this.keys.append,
                    data: item,
                });
                if (response.error) {
                    throw new Error("Unauthorized: Bad key");
                }
                else {
                    return response.payload;
                }
            }
            else {
                throw new Error("Unauthorized: `append` key missing");
            }
        };
        this.replace = async (item) => {
            let response = {};
            if (this.keys.replace) {
                response = await Cupboard.post("replace", {
                    key: this.keys.replace,
                    data: item,
                });
                if (response.error) {
                    throw new Error("Unauthorized: Bad key");
                }
                else {
                    return response.payload;
                }
            }
            else {
                throw new Error("Unauthorized: `replace` key missing");
            }
        };
        this.seed = seed;
        this.keys = keys;
    }
}
_a = Cupboard;
Cupboard.API_URL = "http://localhost:3000/api";
Cupboard.SHORT_HASH_LENGTH = 6;
Cupboard.generateKeys = async (seed) => await Cupboard.post("create", { seed });
Cupboard.post = async (route, parameters) => {
    const url = `${Cupboard.API_URL}/${route}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(parameters),
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }
};
Cupboard.get = async (route, parameters) => {
    const query = new URLSearchParams(parameters).toString();
    const url = `${Cupboard.API_URL}/${route}?${query}`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }
};
