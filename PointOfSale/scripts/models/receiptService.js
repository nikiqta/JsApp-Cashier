let receipts = (function () {

    function getActiveReceipt(userId) {
        const endPoint = `receipts?query={"_acl.creator":"${userId}","active":"true"}`;
        return requester.get('appdata', endPoint, 'Kinvey');
    }

    function getEntriesByReceiptId(receiptId) {
        const endPoint = `entries?query={"receiptId":"${receiptId}"}`;
        return requester.get('appdata', endPoint, 'Kinvey');
    }

    function createReceipt(active, productCount, total) {
        let data = {
            active,
            productCount,
            total
        };
        return requester.post('appdata', 'receipts', 'Kinvey', data);
    }

    function getMyReceipts(userId) {
        const endPoint = `receipts?query={"_acl.creator":"${userId}","active":"false"}`;
        return requester.get('appdata', endPoint, 'Kinvey');
    }

    function receiptDetails(receiptId) {
         const endPoint = `receipts/${receiptId}`;
         return requester.get('appdata', endPoint, 'Kinvey');
    }
    
    function commitReceipt(active, productCount, total, receiptId) {
        const endPoint = `receipts/${receiptId}`;
        let data = {
            active,
            productCount,
            total
        };
        return requester.update('appdata', endPoint, 'Kinvey', data);
    }

    return {
        getActiveReceipt,
        getEntriesByReceiptId,
        createReceipt,
        getMyReceipts,
        receiptDetails,
        commitReceipt
    }
})();