export default function showTotals(data) {
  $('#dust').text(data.dust);
  $('#totalDisenchant').text(data.totalDisenchant);
  $('#nbDTFragments').text(data.DTFragments);
  $('#btnCraftDT').prop('disabled', data.DTFragments < 2);
  if (data.DTFragments) {
    $('#DTFragmentsDiv').show();
  }
}
