// get HTML format version of card
function getCardHTML(arr, showActionButtons, showNote)
{
    // put into table format with first row containing name
    var display = '<TABLE class="scanned_card">'+
                  '<TR>'+
                      '<TD colspan="2" class="scanned_card_header">';

    // showActionButtons are for cards displayed on device, not for those being sent by ajax email program
    if( showActionButtons == true )
    {
       display += getDeleteButton(arr.enc_contact_cust_id);
       display += getEditButton(arr.enc_contact_cust_id);
    }

    // put each piece of given array into card html
    display += '</TD>'+
               '</TR>';

    display += '<TR>';

    display += '<TD style="width:30%">';
    if( arr.img_url != '' ) display += '<div><img src="'+arr.img_url+'" class="badge_photo" onError="this.src=\'images/misc/no-photo.png\'" /></div>';

    display += '</TD>';

    display += '<TD>'+
                     '<div class="contact_name">'+arr.first_name+' '+arr.last_name+'</div>';

    if( arr.email != NA )
       display += '<div class="contact_details">'+arr.email+'</div>';
    else
       display += '<div class="contact_details" style="color:red">EMAIL UNAVAILABLE</div>';

    if( arr.organization != NA )
       display += '<div class="contact_details">'+arr.organization+'</div>';

    if( arr.title != NA )
       display += '<div class="contact_details">'+arr.title+'</div>';

    // include location depending on values of city and state
    var loc = NA;
    if( arr.city != NA ) loc = arr.city;
    if( loc != NA && arr.state != NA ) loc += ' '+arr.state;
    else if( arr.state != NA ) loc = arr.state;

    if( loc != NA )
       display += '<div class="contact_details">'+loc+'</div>';

    if( arr.country != NA )
       display += '<div class="contact_details">'+arr.country+'</div>';
       display += '</TD></TR>';

    // showActionButtons are for existing cards that have notes
    if( showNote == true )
    {
       if( arr.note != '' )
       display += '<TR><TD colspan="2"><div class="contact_details">NOTES: '+arr.note+'</div></TD></TR>';
    }

    display += '</TABLE>';

    return display;
}

// prepare text for sql insert
function csv_prep(str)
{
  return str.toString().replace(/"/g, '""');
}

// get the CSV row format for the given array of field values
function getCardCSV(arr)
{
    var display = '"'+csv_prep(arr.first_name)+' '+csv_prep(arr.last_name)+
                '","'+csv_prep(arr.email)+
                '","'+csv_prep(arr.organization)+
                '","'+csv_prep(arr.title)+
                '","'+csv_prep(arr.city)+
                '","'+csv_prep(arr.state)+
                '","'+csv_prep(arr.country)+
                '","'+csv_prep(arr.note)+
                "\"\n";

    return display;
}

// get the VCF format for the given array of field values
function getCardVCF(arr)
{
  var display = "BEGIN:VCARD\n"+
                "VERSION:3.0\n"+
                "N:\n"+arr.last_name+";"+arr.first_name+";;;\n"+
                "FN:"+arr.first_name+" "+arr.last_name+"\n";

  if( arr.title != NA )
     display += "TITLE:"+arr.title+"\n";

     display += "NOTE:"+arr.note+"\n"+
                "ADR;TYPE=WORK:;;;"+arr.city+';'+arr.state+';;'+arr.country+"\n"+
                "ORG:"+arr.organization+"\n";
                if( arr.email != NA ) display += "EMAIL:"+arr.email+"\n";

     display += "END:VCARD\n";
  return display;
}

// display and store the card info in the database
function data_success(json)
{
  if ( typeof json === 'object' )
  {
    // get the HTML version of the card to show user what has been read by the scan function
    display = getCardHTML(json.attendee[0], true, false);

    // show the card on the scanner page itself
    $('#p').html('<div class="smallbox">' + display + '</div>');

    // insert the values of the json object's attendee array into CONTACT table
    db.transaction( function(tx) {

        getCurrDate(); getCurrTime();
        var note = "Met on " + currdate + " at " + currtime.replace(/:..$/,'');
        var currdatetime = currdate + ' ' + currtime;

        var sql = "INSERT INTO CONTACT ("+contact_fields.toString()+") VALUES ( "+
                  "'" + json.attendee[0].enc_contact_cust_id + "'," +
                  "'" + sql_prep(json.attendee[0].first_name) + "'," +
                  "'" + sql_prep(json.attendee[0].last_name) + "'," +
                  "'" + sql_prep(json.attendee[0].email) + "'," +
                  "'" + sql_prep(json.attendee[0].organization) + "'," +
                  "'" + sql_prep(json.attendee[0].title) + "'," +
                  "'" + sql_prep(json.attendee[0].city) + "'," +
                  "'" + sql_prep(json.attendee[0].state) + "'," +
                  "'" + sql_prep(json.attendee[0].country) + "'," +
                  "'" + sql_prep(note) + "'," +
                  "'" + sql_prep(json.attendee[0].img_url) + "'," +
                  "'" + currdatetime + "'" +
                  " );";

        tx.executeSql( sql, [],
            function(tx, result) {
               // sync this new contact with server
               json.attendee[0].last_updated = currdatetime;
               json.attendee[0].note = note;

               if( MULTISCAN == false || SCANTEST == true )
               {
                  var pagename = $.mobile.activePage.attr("id");
                  if( pagename == 'main_page' ) showCollectedCards();
                  else gotopage('main_page');
               }
               else scan();
            }, function(tx, err) {
               alert('ERROR: Cannot add this contact (maybe already scanned)');
               if( MULTISCAN == false ) gotopage('main_page');
                                   else scan();
            });
    });
  }
  else {
     $('#p').html('other data type');
  }
}

// get the contact information of the badge scanned using the URL read from the QR code
function getContact(url)
{
  // extract the q value from the url
  var arr = /q=(.*)$/.exec(url);
  var q = arr[1];

  db.transaction( function(tx) {
    // check whether a row exists in the table for the given q (encrypted customer ID)
    var sql = "SELECT * FROM CONTACT WHERE enc_contact_cust_id = '" + q + "'";

    tx.executeSql( sql, [], function(tx, result) {
      var therows = result.rows;
      // if no row exists in table for this q, the badge information is not in the table
      // so get the information from the remote script on the web server
      if( therows.length == 0 )
      {
        $.ajax({
          dataType: "json",
          url: url+'&ibr=1',
          success: data_success,
          error: function(err, txt) {
                   alert("ERROR: Unable to get contact info for this badge: " + txt);
                   if( MULTISCAN == false ) gotopage('main_page');
                                       else scan();
                }
        });
      }
      // if a row does exist in table for this q, the badge information has been scanned before (and is in the table)
      // so alert the user that the badge information already exists
      else
      {
        alert('Badge already scanned!');
        if( MULTISCAN == false ) gotopage('main_page');
                            else scan();
      }
    });
  });
}

// scan badge
function scan()
{

  if( SCANTEST == true ) getContact("https://q.informs.org/?q=iLrHxdjxLZd4Cjsei\/QqMg==");
  else
  {
    try {
       cordova.plugins.barcodeScanner.scan(
         // if successful, get text of the result and call get contact details
         function (result) {
           var url = result.text;
             alert(url);
           getContact(url);
         },
         function (error) {
           alert("Scanning failed: " + error);
         }
       );
     }
     catch(error) {
       alert( error );
     }
  }
}

// delete all cards from CONTACT table
function deleteCollectedCards()
{
  db.transaction( function(tx) {
       var sql = "DELETE FROM CONTACT";
       tx.executeSql( sql, [], function(tx, result) {
       });
   });
   resetPage();
}

// reset page to original state
function resetPage()
{
  $('#collected_card_list').html('');
  $('#p').html('');
  displayContactActionButtons();
}

// get delete HTML to be displayed for a card
function getDeleteButton(id)
{
   return '<div style="display:inline-block;width:33%;font-size:8pt;text-align:left" onClick="if( confirm(\'Delete this card?\') ) { deleteCard(\''+id+'\'); }">'+
             'Delete'+
          '</div>';
}

function getRefreshButton(id)
{
   return '<div style="display:inline-block;width:33%;font-size:8pt;text-align:center" onClick="deleteCard(\''+id+'\'); getContact(\'https://q.informs.org/?q='+id+'\');">'+
             'Refresh this info'+
          '</div>';
}

// get Edit HTML to be displayed for a card
function getEditButton(id)
{
   return '<div style="display:inline-block;width:66%;font-size:8pt;white-space:nowrap;text-align:right" onClick="getEditCardScreen(\''+id+'\')" id="EDIT'+id+'">'+
             'Edit Contact'+
          '</div>';
}

// delete the card for given id
function deleteCard(id)
{
  db.transaction( function(tx) {
       var sql = "DELETE FROM CONTACT WHERE enc_contact_cust_id = '"+id+"'";
       tx.executeSql( sql, [], function(tx, result) {
       });
  });
  resetPage();
  showCollectedCards();
}

function editField(id, field, value)
{
  db.transaction( function(tx) {
       var sql = "UPDATE CONTACT SET "+field+" = '"+value+"', last_updated = '"+currdate+' '+currtime+
                 "' WHERE enc_contact_cust_id = '"+id+"'";
       tx.executeSql( sql, [], function(tx, result) {
          $('#editmsg').html('Change saved');
       }, function() { alert('ERROR: '+field+' not changed to '+value); });
  });
}

function getEditCardScreen(id)
{
  $('#collected_card_list').html('');
  gotopage("editcontact_page");
  db.transaction( function(tx) {
    var sql = "SELECT * FROM CONTACT WHERE enc_contact_cust_id = '"+id+"'";
    tx.executeSql( sql, [], function(tx, result) {
      var display = '';
      if( result.rows.length == 1 )
      {
        row = result.rows.item(0);
        var email = row.email;
        if( row.email == NA ) email = '';

        display += "<div id='editmsg'></div>"+
          "<div>"+
            "<h2>"+row.first_name+' '+row.last_name+"</h2>"+
            "<div>EMAIL:</div><div><input type='text' size='30' onBlur='editField(\""+id+"\", \"email\", this.value)' value='"+email+"'></div>"+
            "<div>ORGANIZATION:</div><div><input type='text' size='30' onBlur='editField(\""+id+"\", \"organization\", this.value)' value='"+row.organization+"'></div>"+
            "<div>TITLE:</div><div><input type='text' size='30' onBlur='editField(\""+id+"\", \"title\", this.value)' value='"+row.title+"'></div>"+
            "<div>CITY:</div><div><input type='text' size='30' onBlur='editField(\""+id+"\", \"city\", this.value)' value='"+row.city+"'></div>"+
            "<div>STATE:</div><div><input type='text' size='30' onBlur='editField(\""+id+"\", \"state\", this.value)' value='"+row.state+"'></div>"+
            "<div>COUNTRY:</div><div><input type='text' size='30' onBlur='editField(\""+id+"\", \"country\", this.value)' value='"+row.country+"'></div>"+
            "<div>NOTE:</div><div><textarea cols='32' rows='7' onBlur='editField(\""+id+"\", \"note\", this.value)'>"+row.note+"</textarea></div>"+
          "</div>";
        $('#editform').html(display);
      }
      else gotopage('main_page');
    });
  });
}

function saveManualContact()
{
    db.transaction( function(tx) {
        var id = Math.random();
        var name = sql_prep($('#CARD_FIRST_NAME').val()) + ' ' + sql_prep($('#CARD_LAST_NAME').val());
        var currdatetime = currdate + ' ' + currtime;
        var sql = "INSERT INTO CONTACT ("+contact_fields.toString()+") VALUES ( "+
                  "'" + id + "'," +
                  "'" + sql_prep($('#CARD_FIRST_NAME').val()) + "'," +
                  "'" + sql_prep($('#CARD_LAST_NAME').val()) + "'," +
                  "'" + sql_prep($('#CARD_EMAIL').val()) + "'," +
                  "'" + sql_prep($('#CARD_ORGANIZATION').val()) + "'," +
                  "'" + sql_prep($('#CARD_TITLE').val()) + "'," +
                  "'" + sql_prep($('#CARD_CITY').val()) + "'," +
                  "'" + sql_prep($('#CARD_STATE').val()) + "'," +
                  "'" + sql_prep($('#CARD_COUNTRY').val()) + "'," +
                  "'" + sql_prep($('#CARD_NOTE').val()) + "'," +
                  "''," +
                  "'" + currdatetime + "'" +
                  " );";

        tx.executeSql( sql, [], function(tx, result) { alert(name + ' added'); gotopage('main_page'); },
                                function() { alert('ERROR: Cannot add this contact'); });
   });
}

function getAddCardScreen()
{
  gotopage("editcontact_page");

  getCurrDate(); getCurrTime();
  var note = "Met on " + currdate + " at " + currtime.replace(/:..$/,'');

  var display = "<div class='smallbox'><div data-role='fieldcontain'>";
  display += "<div>FIRST NAME:</div><div><input type='text' size='30' id='CARD_FIRST_NAME'></div>";
  display += "<div>LAST NAME:</div><div><input type='text' size='30' id='CARD_LAST_NAME'></div>";
  display += "<div>EMAIL:</div><div><input type='text' size='30' id='CARD_EMAIL'></div>";
  display += "<div>ORGANIZATION:</div><div><input type='text' size='30' id='CARD_ORGANIZATION'></div>";
  display += "<div>TITLE:</div><div><input type='text' size='30' id='CARD_TITLE'></div>";
  display += "<div>CITY:</div><div><input type='text' size='30' id='CARD_CITY'></div>";
  display += "<div>STATE:</div><div><input type='text' size='30' id='CARD_STATE'></div>";
  display += "<div>COUNTRY:</div><div><input type='text' size='30' id='CARD_COUNTRY'></div>";
  display += "<div>NOTE:</div><div><textarea cols='32' rows='7' id='CARD_NOTE'>"+note+"</textarea></div>";
  display += "<div><input type='submit' onClick='saveManualContact()'></div>";
  display += "</div>";

  $('#editform').html(display);
}

function showCollectedCards()
{
  db.transaction( function(tx) {
       var sql = "SELECT * FROM CONTACT";
       tx.executeSql( sql, [], function(tx, result) {
         var therows = result.rows;
         var count = therows.length;
         var display = '';
         for( var i = 0; i < count; i++)
         {
            var therow = result.rows.item(i);
            display += getCardHTML(therow, true, true);
         }
         $('#collected_card_list').html('<div class="box">'+display+'</div>');
       });
   });
}

// emails all cards to specified email address with specified format
function emailCollectedCards(email, format)
{
  db.transaction( function(tx) {
       // query to get all card info
       var sql = "SELECT * FROM CONTACT";
       tx.executeSql( sql, [], function(tx, result) {
         var therows = result.rows;
         var count = therows.length;
         var content = '';

         // if format is csv, start email content with header row
         if( format == 'csv' ) content = '"NAME","EMAIL","ORGANIZATION","TITLE","CITY","STATE","COUNTRY","NOTES"'+"\n";

         // for each card found in table
         for( var i = 0; i < count; i++) {
            var therow = result.rows.item(i);
                 if( format == 'html' ) content += getCardHTML(therow, false, true);
            else if( format == 'csv' ) content += getCardCSV(therow);
            // default format is vcf
            else {
               format = 'vcf';
               content += getCardVCF(therow);
            }
         }

         // use ajax to call script on web server to send the email message
         $.ajax({
           dataType: 'text',
           url: EMAIL_SCRIPT,
           type: 'POST',
           data: { content: content, email: email, format: format, token: ajax_token },
           success: function(msg) {
                      //if( msg != '' ) $.alert(msg, 'NOTE');
                      if( msg != '' ) alert('NOTE: '+msg);
                      displayContactActionButtons();
                      showCollectedCards();
                    },
           error: function(err, txt) {
                   alert( "ERROR: Not able to send contacts by email at this time: " + txt );
                 }
         });
       });
   });
}

// initializes badge reader home page
function showBadgeMenu()
{
  displayContactActionButtons();
  showCollectedCards();
}

function displayContactActionButtons()
{
  $('#SCAN').html("<div onClick='MULTISCAN = false; gotopage(\"scanner_page\")' class='scan_btn'>Scan a badge</div>"+
                  "<div onClick='MULTISCAN = true; gotopage(\"scanner_page\")' class='scan_btn'>Scan multiple badges</div>"+
                  "<div onClick='getAddCardScreen()' class='scan_btn'>Add a contact manually</div>");

  db.transaction( function(tx) {
    var sql = "SELECT * FROM CONTACT";

    tx.executeSql( sql, [], function(tx, result) {
      // if no contact exists, hide the buttons that pertain to contacts
      if( result.rows.length == 0 ) {
        $('#EMAIL_SECTION').html('');
      }
      // if at least one contact exists, show the buttons that pertain to contacts
      else {
        $('#EMAIL_SECTION').html(
          '<div class="scan_btn" onClick="toggleDisplay(\'EMAIL_FORM\')">Send contact info to ...</div>'+
          '<div id="EMAIL_FORM" class="hidden_details smallbox">'+
             '<input style="margin:5px;padding:10px;width:90%" id="EMAIL_ADDRESS" placeholder="Your email address" value="'+email_address+'" />'+
             '<SELECT name="email_format" style="margin:5px;padding:10px" id="FORMAT_CHOICES">'+
                  '<option value="">Choose format</option>'+
                  '<option value="vcf">VCARD (Outlook Contact)</option>'+
                  '<option value="csv">CSV (spreadsheet)</option>'+
                  '<option value="html">HTML (print format)</option>'+
             '</SELECT>'+
             '<button onClick="emailCollectedCards($(\'#EMAIL_ADDRESS\').val(), $(\'#FORMAT_CHOICES\').val())" class="smallbox orange">SEND</button>'+
          '</div>');
      }
    });
  });
}

