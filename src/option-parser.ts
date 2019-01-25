import minimist from "minimist";

export const parseOptions = (args: string[]) =>
    minimist(args, {
        alias: {
            output: "o",
            files: "f",
        },
    });
