<?php
/*
* Name: Nate Gibson
* Date: 11/29/18
* Section: CSE 154 AL
*
* This is the PHP to implement the API for generating new random plans and tasks.
*
* Web service details:
*   Required GET parameters:
*     - type
*   examples:
*     - type=task
*   Output Format:
*   - txt or JSON
*   Output Details:
*     - If mode parameter is passed and is set to task, it will output plain text that contains a
*       randomly generated task of the form: "I need to *random verb* my *random noun*".
*     - If mode parameter is passed and set to plan, a json encoded object that contains a random
*       start and end time of the form: "HH:MM", and a randomly generated event of the form:
*       "*random verb* my *random noun*".
*   - Else outputs error message.
*/

  error_reporting(E_ALL);
  ini_set('display_errors', 1);

  if (isset($_GET["type"])) {
    $type = $_GET["type"];
    if ($type === "task") {
      header("Content-type: text/plain");
      echo "I need to " . generateRandEvent();
    } else if ($type === "plan") {
      header("Content-type: application/json");
      echo getRandPlan();
    } else {
      handle_error("Error: Invalid Type Parameter");
    }
  } else {
    handle_error("Error: Missing Parameter");
  }

  /**
   * Returns a random plan with a start time, end time, and plan values in JSON format.
   * @returns {object} JSON object with plan values
   */
  function getRandPlan() {
    $plan = array();
    $plan["start"] = generateRandTime();
    $plan["end"] = generateRandTime();
    $plan["plan"] = generateRandEvent();

    return json_encode($plan);
  }

  /**
   * Returns a random event for the form "random verb my random noun" from 'Planner' database.
   * @returns {string} event string
   */
  function generateRandEvent() {
    $db = get_PDO();
    try {
      return getRandType($db, "verb") . " my " . getRandType($db, "noun");
    } catch (PDOException $ex) {
      handle_error("Cannot query the database", $ex);
    }
  }

  /**
   * Returns the value of a random string from db of type.
   * @param {PDO} db - Planner database PDO object
   * @param {string} type - type of word (e.g. noun)
   * @returns {string} random string of type.
   */
  function getRandType($db, $type) {
    $words_of_type = $db->query("SELECT word FROM Words WHERE type = '{$type}';")->fetchAll();
    return str_replace("\n", "", strtolower(getRandFromArray($words_of_type)[0]));
  }

  /**
   * Returns the value of a random index of array.
   * @param {array} array - input array
   * @returns {value} value at array index.
   */
  function getRandFromArray($array) {
    return $array[array_rand($array)];
  }

  /**
   * Returns a random time of the form "HH:MM".
   * @returns {string} time string
   */
  function generateRandTime() {
    $hour = rand(0, 1);
    if ($hour === 0) {
      $hour .= rand(1,9);
    } else {
      $hour .= rand(0,2);
    }

    $min = rand(0, 60);
    if ($min < 10) {
      $min = "0" . $min;
    }

    return "{$hour}:{$min}";
  }

  /**
   * Got function from week 9 Section:
   * Returns a PDO object connected to the bmstore database. Throws
   * a PDOException if an error occurs when connecting to database.
   * @return {PDO}
   */
  function get_PDO() {
    # Variables for connections to the database.
    $host =  "localhost";
    $port = "3306"; # Make sure this matches your server (e.g. MAMP) port
    $user = "root";
    $password = "root";
    $dbname = "planner";

    $ds = "mysql:host={$host}:{$port};dbname={$dbname};charset=utf8";
    try {
      $db = new PDO($ds, $user, $password);
      $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      return $db;
    } catch (PDOException $ex) {
      handle_error("Can not connect to the database. Please try again later.", $ex);
    }
  }

  /**
   * Got function from week 9 Section:
   * Prints out a plain text 400 error message given $msg. If given a second (optional) argument as
   * an PDOException, prints details about the cause of the exception.
   * @param $msg {string} - Plain text 400 message to output
   * @param $ex {PDOException} - (optional) Exception object with additional exception details to print
   */
  function handle_error($msg, $ex=NULL) {
    header("HTTP/1.1 400 Invalid Request");
    header("Content-type: text/plain");
    print ("{$msg}\n");
    if ($ex) {
      print ("Error details: $ex \n");
    }
  }
?>
