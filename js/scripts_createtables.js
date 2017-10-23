var db = openDatabase( 'INFORMS Contact', '', 'INFORMS Contact Database', 2 * 1024 * 1024 );

function createContact()
{
  db.transaction(function ( tx ) {
     tx.executeSql(
   'CREATE TABLE IF NOT EXISTS CONTACT '+
   '( enc_contact_cust_id TEXT, first_name TEXT, last_name TEXT, email TEXT, organization TEXT, title TEXT, '+
     'city TEXT, state TEXT, country TEXT, note TEXT, img_url TEXT, last_updated TEXT, '+
     'PRIMARY KEY(enc_contact_cust_id) )');
  }, errorHandler);
}

