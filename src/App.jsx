// SJSU CS 218 Spring 2021 TEAM4

import React from 'react';
import './App.css';
import Amplify, {API, graphqlOperation, Storage, Auth} from 'aws-amplify';
import awsconfig from './aws-exports';
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react';
import {listUserFiles} from './graphql/queries';
import {createUserFile} from './graphql/mutations';

import {useState, useEffect} from 'react';
import ReactPlayer from 'react-player';

import {v4 as uuid} from 'uuid';

import {Paper, IconButton, TextField} from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

import StopIcon from '@material-ui/icons/Stop';
import AddIcon from '@material-ui/icons/Add';
import PublishIcon from '@material-ui/icons/Publish';

import axios from 'axios';


Amplify.configure(awsconfig);

function App() {
  const [userFiles, setUserFiles] = useState([]);
  const [userFilePlaying, setUserFilePlaying] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [showAddUserFile, setShowAddNewUserFile] = useState(false);
  const [sourceLang, setSourceLang] = useState('');
  const [destinationLang, setDestinationLang] = useState('');
  const [filePath, setFilePath] = useState(null);
  const [convertedFileData] = useState({});
  const [fileTitle, setFileTitle] = useState("");
  var [currentUserName] = useState("");
  var [convertedOwner] = useState("");
  var inputForGet = "";
  var transcript = "...";
  var element  = document.getElementById("trans");

  
  const AddUserFile = ({onUpload}) => {

    const [mp3Data, setMp3Data] = useState();
    const [currUserFileData, setCurrUserFileData] = useState({});
    var [fileOwner] = useState("");
  
  
    const uploadUserFile = async () => {
      try{

        const authResponse1 = Auth.currentAuthenticatedUser();
        // console.log("User Info:", authResponse);
        const fullData1 = await authResponse1;
        const username1 = fullData1.username;
        // console.log("UName Inside Function:", username1);
        fileOwner = username1;
        // console.log("UName Assigned to fileOwner: ", fileOwner);


        // setCurrUserFileData({ ...currUserFileData, owner: `${currentUserName}`});
        currUserFileData.owner = `${fileOwner}`;
        const { title, description, owner } = currUserFileData;

        setFileTitle(title);
  
        const { key } = await Storage.put(`${uuid()}.mp3`, mp3Data, {contentType: 'audio/mp3' });
        
        setFilePath(key);

        // console.log("User File Upload Key:", key);

        const createUserFileInput = {
          // id: `${fileOwner}`,
          id: uuid(),
          title,
          description,
          owner,
          filePath: key
        }
        await API.graphql(graphqlOperation(createUserFile, {input: createUserFileInput}))
        console.log('User file uploaded successfully!');
        onUpload();
      } catch (error) {
        console.log('Error in uploading new File', error);
        onUpload();
      }
    };
  
    return (
      <div className="newUserFile">
        <TextField 
          label="Title" 
          value={currUserFileData.title} 
          onChange={e => setCurrUserFileData({ ...currUserFileData, title: e.target.value })} 
        />
        <TextField label="Description" 
          value={currUserFileData.description} 
          onChange={e => setCurrUserFileData({ ...currUserFileData, description: e.target.value })} 
        />
        <input type="file" accept="audio/mp3" onChange={e => setMp3Data(e.target.files[0])} />
        <IconButton onClick={uploadUserFile}>
          <PublishIcon />
        </IconButton>
      </div>
    );
  };


  const showFile = async (feedToDBAudioPath) => {

    const textFilePath = feedToDBAudioPath.slice(0, -3) + "txt";
    console.log("Text File Path: ", textFilePath);

    const textFileAccessURL = await Storage.get(textFilePath);

    const textResponse = axios.get(textFileAccessURL);
    const fullTextData = await textResponse;
    transcript = await fullTextData.data;
    console.log("Text Response Data: ", fullTextData);
    console.log("Transcript: ", transcript);
    element.innerHTML = transcript;
  };


  const convertedFileToDB = async (feedToDBAudioPath) => {
    try {
      const authResponse1 = Auth.currentAuthenticatedUser();
      // console.log("User Info:", authResponse);
      const fullData1 = await authResponse1;
      const username1 = fullData1.username;
      // console.log("UName Inside Function:", username1);
      convertedOwner = username1;
      // console.log("Converted file Owner: ", convertedOwner);

      // convertedFileData.title = `File: ${uuid()}`;
      convertedFileData.title = `${fileTitle}: ${sourceLang} To ${destinationLang}`;
      convertedFileData.description = "Converted";
      convertedFileData.owner = `${convertedOwner}`;

      const { title, description, owner } = convertedFileData;

      // console.log("Inside DB Fill Fun: ", feedToDBAudioPath);
      const key = feedToDBAudioPath;
      // console.log("Key to Converted File: ", key);
      // console.log("Title to Converted File: ", title);
      // console.log("Desc to Converted File: ", description);
      // console.log("Owner to Converted File: ", owner);

      const createConvertedFileInput = {
        id: uuid(),
        title,
        description,
        owner,
        filePath: key
      }

      console.log("Inserting in DynamoDB:", createConvertedFileInput);


      await API.graphql(graphqlOperation(createUserFile, {input: createConvertedFileInput}));
      console.log('Converted file uploaded successfully!');

      showFile(feedToDBAudioPath);
      fetchUserFiles();
      alert(`Translation from ${sourceLang} to ${destinationLang} complete!`);

    } catch (error) {
      console.log('Error inserting converted file to DB', error);
    }
  }


  useEffect(() => {
    fetchUserFiles();
  }, []);

  const toggleUserFile = async idx => {
    if (userFilePlaying === idx) {
      setUserFilePlaying('');
      return;  
    }


    const userFilePath = userFiles[idx].filePath;
    try {
        // console.log("User File Path: ", userFilePath);
        const fileAccessURL = await Storage.get(userFilePath, { expires: 60 })
        // console.log('Access URL: ', fileAccessURL);
        setUserFilePlaying(idx);
        setAudioURL(fileAccessURL);
        return;
    } catch (error) {
      console.log('Error accessing User file from S3', error);
      setAudioURL('');
      setUserFilePlaying('');
    }
  }


  const fetchUserFiles = async () => {
      try {

          const authResponse = Auth.currentAuthenticatedUser();
          // console.log("User Info:", authResponse);
          const fullData = await authResponse;
          const username = fullData.username;
          // console.log("Just Username:", username);
          currentUserName = username;
          // console.log("Current Username: ", currentUserName);

          
          // const userFileData = await API.graphql(graphqlOperation(listUserFiles));
          const userFileData = await API.graphql(graphqlOperation(listUserFiles, {filter: {owner: {eq: `${currentUserName}`}}}));
          const userFileList = userFileData.data.listUserFiles.items;
          console.log('Retrieved User Files: ', userFileData);
          setUserFiles(userFileList);
      } catch (error) {
          console.log('Error on fetching userFiles', error);
      }
  };


  const triggerGETRequest = async () => {

    const getQuery = `https://gbvv9l173k.execute-api.eu-west-1.amazonaws.com/alpha/execution?executionStateArn=arn:aws:states:eu-west-1:203527985016:execution:cloud-state-machine:${inputForGet}`

    console.log("GET Query", getQuery);

    const getResponse = axios.get(getQuery);
    const fullData = await getResponse;
    console.log("GET Response Data: ", fullData);
    const statusCode = fullData.data.statusCode;
    const status = fullData.data.status;
    const audioFile = fullData.data.audioFile;

    console.log("GET Status Code: ", statusCode);
    console.log("GET Status: ", status);
    // console.log("GET Audio File: ", audioFile);

    if (statusCode === 400){
      console.log("Translate Operation Failed!");
      alert('Operation Failed! Please try again after sometime...');
      return;
    } else if (statusCode === 202){
      console.log("Translation still in progress!");
      alert("Translation in progress..");
      setTimeout(triggerGETRequest, 10000);
      return;
    }

    const feedToDBAudioPath = audioFile.slice(-40, );
    console.log("Converted Audio S3 Path: ", feedToDBAudioPath);

    if (statusCode === 200){
      convertedFileToDB(feedToDBAudioPath);
    }

  }

  const translator = async (e) => {
    e.preventDefault();
    try {
      console.log("Selected Source Language: ", sourceLang);
      console.log("Selected Target Language: ", destinationLang);
      console.log("Uploaded FileName: ", filePath);

      if (filePath === null){
        alert('Operation Failed! Please upload a file for conversion...');
        return;
      }
      if (sourceLang === ''){
        alert('Operation Failed! Please select source language for conversion...');
        return;
      }
      if (destinationLang === ''){
        alert('Operation Failed! Please select destination language for conversion...');
        return;
      }

      let options = {
        headers: {
          'Content-Type': 'application/json'
        }
      }

      let graphql_query1 = `{
        "input": "{\\"file\\": \\"${filePath}\\", \\"sourceLang\\": \\"${sourceLang}\\", \\"targetLang\\": \\"${destinationLang}\\"}",
        "stateMachineArn": "arn:aws:states:eu-west-1:203527985016:stateMachine:cloud-state-machine"
      }`

      console.log("POST Query", graphql_query1);
 
      const postResponse = axios.post('https://9kbrk4j6m4.execute-api.eu-west-1.amazonaws.com/alpha/execution', graphql_query1, options);
      const fullData = await postResponse;
      const executionArn = fullData.data.executionArn;

      console.log("POST Response Data: ", fullData);
      console.log("POST Arn: ", executionArn);

      inputForGet = executionArn.slice(-36, );
      console.log("Arn for GET: ", inputForGet);
  
      alert("Request submitted!");
      setTimeout(triggerGETRequest, 20000);

    } catch (error) {
      console.log('Error in POST request', error);
    }
  }

  
  return (
    <div className="App">
      <header className="App-header">
        <h2>Audio Translator App</h2>
        <button className="signOut"><AmplifySignOut /></button>
      </header>
      <main>
        <span><h3>Click + to add new file</h3></span>
        <div className="userFileRoster">
          { userFiles.map((userFile, idx) => {
            return (
              <Paper variant="outlined" elevation={2} key={`userFile${idx}`}>
                <div className="userFileCard">
                  <IconButton aria-label="play" onClick={() => toggleUserFile(idx)}>
                    { userFilePlaying === idx ? <StopIcon /> : <PlayArrowIcon /> }
                  </IconButton>
                  <div>
                    <div className="userFileTitle">{userFile.title}</div>
                  </div>
                  <div className="userFileDescription">{userFile.description}</div>
                </div>
                {
                  userFilePlaying === idx ? (
                    <div className='theAudioPlayer'>
                      <ReactPlayer 
                        url={audioURL}
                        controls
                        playing
                        height="50px"
                      />
                    </div>
                  ) : null
                }
              </Paper>
            );
          })}
          {
            showAddUserFile ? (
              <AddUserFile onUpload={() => {
                setShowAddNewUserFile(false)
                fetchUserFiles();
                alert("File uploaded successfully!");
              }} />
            ) : <IconButton onClick={() => setShowAddNewUserFile(true)}>
                  <AddIcon />
                </IconButton>
          }
        </div>
      </main>
      <footer>
        <div className='sourceLanguage'>
          <form onSubmit={translator}>
            <label htmlFor="languageSelection"><h3>Choose Source and Destination Language</h3></label><br></br>
            <select name="source" id="source" required onChange={(e) => setSourceLang(e.target.value)}>
              <option disabled="disabled" selected>Choose Source Language</option>
              <option value="Arabic">Arabic</option>
              <option value="Chinese">Chinese</option>
              <option value="Dutch">Dutch</option>
              <option value="English, British">English, British</option>
              <option value="English, Indian">English, Indian</option>
              <option value="English, US">English, US</option>
              <option value="English, Australian">English, Australian</option>
              <option value="Spanish, European">Spanish, European</option>
              <option value="Spanish, Mexican">Spanish, Mexican</option>
              <option value="French">French</option>
              <option value="French, Canadian">French, Canadian</option>
              <option value="Hindi">Hindi</option>
              <option value="German">German</option>
              <option value="Italian">Italian</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Russian">Russian</option>
              <option value="Turkish">Turkish</option>
            </select>
            <select name="destination" id="destination" required onChange={(e) => setDestinationLang(e.target.value)}>
              <option disabled="disabled" selected>Choose Destination Language</option>
              <option value="Arabic">Arabic</option>
              <option value="Chinese">Chinese</option>
              <option value="Dutch">Dutch</option>
              <option value="English, British">English, British</option>
              <option value="English, Indian">English, Indian</option>
              <option value="English, US">English, US</option>
              <option value="English, Australian">English, Australian</option>
              <option value="Spanish, European">Spanish, European</option>
              <option value="Spanish, Mexican">Spanish, Mexican</option>
              <option value="French">French</option>
              <option value="French, Canadian">French, Canadian</option>
              <option value="Hindi">Hindi</option>
              <option value="German">German</option>
              <option value="Italian">Italian</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Russian">Russian</option>
              <option value="Turkish">Turkish</option>
            </select><br/><br/>
            <button>Submit</button>
          </form>
        </div>

        <div><br/><br/>
          <output className="transcript" id="trans">...</output>
        </div>
      </footer>
    </div>
  );
}

export default withAuthenticator(App);
