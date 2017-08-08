function patchData(data) {
    return /:\s*,|:\s*\}/g.replace(data, ' null');
}

exports.patchData = patchData;