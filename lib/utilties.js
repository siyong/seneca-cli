function patchData(data) {
    const regex = /:\s*([,|\}])/g;
    return data.replace(regex, ': null $1');
}

exports.patchData = patchData;