// @snippet:start usages:0, simple-usage
import minimist from "minimist";
// @snippet:end usages

const options = minimist(process.argv.slice(1));
// @snippet:end

// @snippet:start usages:1
const extractedOptions = minimist(process.argv.slice(1), {
    aliases: {
        'o': 'options'
    }
})
// @snippet:end usages

