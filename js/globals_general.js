var currdate = '';
var currtime = '';

var button_down = 'ui-btn ui-icon-arrow-d ui-btn-icon-right';
var button_right = 'ui-btn ui-icon-arrow-r ui-btn-icon-right';
var button_plain = 'ui-btn';

var button_down_round = button_down+' ui-corner-all';
var button_right_round = button_right+' ui-corner-all';
var button_plain_round = button_plain+' ui-corner-all';
var button_inline = 'ui-btn ui-btn-inline ui-corner-all';
var button_inline_round = button_inline+' ui-corner-all';

var NO_DATA_WARNING = '<div class="smallbox white" style="color:red">No data. Please connect to network and '+
                      '<div style="color:blue" onClick="checkAndUpdateDatabase(0, true)">'+
                          'get conference information.'+
                      '</div></div>';

var NETWORK_ERROR = false;
var NETWORK_ERROR_MSG = '<div class="warning"><span onClick="checkAndUpdateDatabase(0, true)">No network connection. Click to check and refresh.</span></div>';
var INIT_NETWORK_ERROR_NOTIFIED = false;
var initializing = true;
var MULTISCAN = false;
var SCANTEST = false;
var NA = 'N/A';
var ajax_token = 'vBm7zPnRseKKf2La';

var contact_fields = [ 'enc_contact_cust_id', 'first_name', 'last_name', 'email', 'organization', 'title', 'city', 'state', 'country', 'note', 'img_url', 'last_updated' ];

var email_address = '';

var ROOT_DIR = 'https://biblio.informs.org/mobile';
var SCRIPTS_DIR = ROOT_DIR + '/scripts';
var EMAIL_SCRIPT = SCRIPTS_DIR + '/email_contacts.php';
