const TRANSACTION_STATUS = Object.freeze({
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED"
});

const LEDGER_TYPE = Object.freeze({
  DEBIT: "DEBIT",
  CREDIT: "CREDIT"
});

module.exports = {
  TRANSACTION_STATUS,
  LEDGER_TYPE
};
