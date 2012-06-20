var table_selected = '';

function changeTable(table, option_query_max_matches) {
	table_selected = table;
	var sql = "SELECT * FROM " + table + " ORDER BY id DESC LIMIT 0, 10 OPTION max_matches = " + option_query_max_matches;
	document.queryfm.sql.value = sql;
	document.queryfm.table.value = table_selected;
}

function sqlfmSubmit() {
	table_selected = document.queryfm.table[document.queryfm.table.selectedIndex].text;
	document.queryfm.table.value = table_selected;
	document.forms["queryfm"].submit();
	return;
}
