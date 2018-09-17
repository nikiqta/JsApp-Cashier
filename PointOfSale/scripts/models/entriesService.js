let entries = (function () {
    
    function addEntry(type, qty, price, receiptId) {
        let data = {
            type,
            qty,
            price,
            receiptId
        };
        return requester.post('appdata', 'entries', 'Kinvey', data);
    }
    
    function deleteEntry(entryId) {
        const endPoint = `entries/${entryId}`;
        return requester.remove('appdata', endPoint, 'Kinvey',);
    }
    
    return{
        addEntry,
        deleteEntry
    }
})();
