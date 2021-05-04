import React from 'react';
import './App.css';
import Amplify, {API, graphqlOperation, Storage, Auth} from 'aws-amplify';
import awsconfig from './aws-exports';
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react';
import {listUserFiles} from './graphql/queries';
import {createUserFile, deleteUserFile} from './graphql/mutations';

import {useState, useEffect} from 'react';
import ReactPlayer from 'react-player';

import {v4 as uuid} from 'uuid';

import {Paper, IconButton, TextField} from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

import StopIcon from '@material-ui/icons/Stop';
import AddIcon from '@material-ui/icons/Add';
import PublishIcon from '@material-ui/icons/Publish';

import axios from 'axios';

// import AWS from 'aws-sdk';


Amplify.configure(awsconfig);

function App() {
  const [userFiles, setUserFiles] = useState([]);
  const [userFilePlaying, setUserFilePlaying] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [showAddUserFile, setShowAddNewUserFile] = useState(false);
  const [sourceLang, setSourceLang] = useState('');
  const [destinationLang, setDestinationLang] = useState('');
  const [filePath, setFilePath] = useState(null);
  var [inputForGet, setInputForGet] = useState("");
  var [feedToDBAudioPath, setFeedToDBAudioPath] = useState("");
  const [convertedFileData, setConvertedFileData] = useState({});
  var [currentUserName, setCurrentUserName] = useState("");
  // const [deleteFileData, setDeleteFileData] = useState({});
  // var [deleteOwner, setDeleteOwner] = useState("");
  


  const AddUserFile = ({onUpload}) => {

    const [userFileData, setUserFileData] = useState({});
    const [mp3Data, setMp3Data] = useState();
    const [currUserFileData, setCurrUserFileData] = useState({});
    var [fileOwner, setFileOwner] = useState("");
  
  
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
  
        const { key } = await Storage.put(`${uuid()}.mp3`, mp3Data, {contentType: 'audio/mp3' });
        
        setFilePath(key);

        const createUserFileInput = {
          // id: `${fileOwner}`,
          id: uuid(),
          title,
          description,
          owner,
          filePath: key
        }
        await API.graphql(graphqlOperation(createUserFile, {input: createUserFileInput}))
        console.log('File uploaded successfully!');
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
        {/* <TextField label="Owner" 
          value={userFileData.owner} 
          onChange={e => setUserFileData({ ...userFileData, owner: e.target.value })} 
        /> */}
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


  const convertedFileToDB = async () => {
    alert('File has been converted!');

    try {
      convertedFileData.title1 = "Converted File";
      convertedFileData.description1 = "Just Converted";
      convertedFileData.owner1 = `${currentUserName}`;

      const { title1, description1, owner1 } = convertedFileData;

      const { key } = feedToDBAudioPath;

      const createConvertedFileInput = {
        id: uuid(),
        title1,
        description1,
        owner1,
        filePath: key
      }

      await API.graphql(graphqlOperation(createUserFile, {input: createConvertedFileInput}))
      console.log('Converted file is now in DB!');

      fetchUserFiles();

    } catch (error) {
      console.log('Error assigning converted file to DB', error);
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
        const fileAccessURL = await Storage.get(userFilePath, { expires: 60 })
        console.log('Access URL: ', fileAccessURL);
        setUserFilePlaying(idx);
        setAudioURL(fileAccessURL);
        return;
    } catch (error) {
      console.log('Error accessing userFiles from S3', error);
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
          console.log("Current Username: ", currentUserName);

          
          // const userFileData = await API.graphql(graphqlOperation(listUserFiles));
          const userFileData = await API.graphql(graphqlOperation(listUserFiles, {filter: {owner: {eq: `${currentUserName}`}}}));
          const userFileList = userFileData.data.listUserFiles.items;
          console.log('User File List', userFileData);
          setUserFiles(userFileList);
      } catch (error) {
          console.log('Error on fetching userFiles', error);
      }
  };


  const createAlert = () => {
    alert("Request Submitted to Server");
    alert("Please wait a few moments to view results");

    setTimeout(triggerGETRequest, 5000);
  }


  const triggerGETRequest = async () => {

    const getQuery = `https://gbvv9l173k.execute-api.eu-west-1.amazonaws.com/alpha/execution?executionStateArn=arn:aws:states:eu-west-1:203527985016:execution:cloud-state-machine:${inputForGet}`

    console.log("GET Query", getQuery);

    const getResponse = axios.get(getQuery);
    // const getResponse = await axios.get('http://ptsv2.com/t/jlsx9-1620054951/post');
    const fullData = await getResponse;
    console.log("GET Full Data: ", fullData);
    const statusCode = fullData.data.statusCode;
    const status = fullData.data.status;
    const audioFile = fullData.data.audioFile;

    console.log("GET Status Code: ", statusCode);
    console.log("GET Status: ", status);
    console.log("GET Audio File: ", audioFile);

                                                                // var def = "s3://userfile-storage190018-dev/public/5d0a42db-d8a4-4192-925d-b1369096fa47.mp3";
                                                                // feedToDBAudioPath = def.slice(-40, );
    const feedToDBAudioPath = audioFile.slice(-40, );
    console.log("Feed To DB Audio FilePath", feedToDBAudioPath);

    if (statusCode === 400){
      console.log("Translate Operation Failed!");
      alert('Operation Failed! Please try again after sometime..');
    } else if (statusCode === 202){
      console.log("Request in progress!");
      alert('Almost done! Wait a sec..');
      setTimeout(triggerGETRequest, 10000);
    }else if (statusCode === 200){
      convertedFileToDB();
    }

  }

  const translator = async (e) => {
    e.preventDefault();
    try {
      console.log('Reached Translator');
      console.log(sourceLang);
      console.log(destinationLang);
      console.log("Uploaded FileName: ", filePath);

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
      // const postResponse = await axios.post('https://httpbin.org/post', graphql_query1, options);
      const fullData = await postResponse;
      const executionArn = fullData.data.executionArn;

      console.log("POST Full Data: ", fullData);
      console.log("POST Arn: ", executionArn);

                                                        // var abc = "arn:aws:states:eu-west-1:203527985016:execution:cloud-state-machine:077b59fc-0d4f-72ad-aa24-ec74067a2bdc";
                                                        // inputForGet = abc.slice(-36, );
      inputForGet = executionArn.slice(-36, );
      console.log("Arn for GET", inputForGet);
  

      setTimeout(triggerGETRequest, 1000);

    } catch (error) {
      console.log('Error in POST request', error);
    }
  }

  const dump = async () => {
    try {
      console.log("Reached DUMP");
    } catch (error) {
      console.log('Error in DUMP', error);
    }
  }

  function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
    dump();
  }
  
  // Close the dropdown menu if the user clicks outside of it
  window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }


  return (
    <div className="App">
      <header className="App-header">
        <div className="dropdown">
          <button onClick={myFunction} className="dropbtn">Exit</button>
          <div id="myDropdown" className="dropdown-content">
            <p><AmplifySignOut /></p>
          </div>
        </div>
        <h2>Audio Translator App</h2>
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
                    <div className="userFileOwner">{userFile.owner}</div>
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
                alert("Note: File upload limited to 1 file per login.");
                setShowAddNewUserFile(false)
                fetchUserFiles();
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
              <option value="English, US">English, US</option>
              <option value="Spanish, European">Spanish, European</option>
              <option value="German">German</option>
              <option value="Hindi">Hindi</option>
            </select>
            <select name="destination" id="destination" required onChange={(e) => setDestinationLang(e.target.value)}>
              <option disabled="disabled" selected>Choose Destination Language</option>
              <option value="English, US">English, US</option>
              <option value="Spanish, European">Spanish, European</option>
              <option value="German">German</option>
              <option value="Hindi">Hindi</option>
            </select><br/><br/>
            <button>Submit</button>
          </form>
        </div><br/><br/><br/><br/>
        <div>
          <button onClick={createAlert}>Check Status</button>
        </div>

      </footer>
    </div>
  );
}

export default withAuthenticator(App);

