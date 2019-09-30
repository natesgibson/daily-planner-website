<?php
/*
* Name: Nate Gibson
* Date: 11/29/18
* Section: CSE 154 AL
*
* This a php file that outputs text to use for sql insert value data from text files.
*/

  error_reporting(E_ALL);
  header("Content-type: text/plain");

  function insert_db_from_file($filename, $type) {
    foreach (file($filename) as $word) {
      $word = trim(str_replace("\n", "", $word));
      echo "('{$word}', '{$type}'),\n";
    }
  }

  insert_db_from_file("nounlist.txt", "noun");
  insert_db_from_file("verblist.txt", "verb");
?>
