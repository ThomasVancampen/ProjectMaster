const fileInput = document.querySelector('#file-js-example input[type=file]');
  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      const fileName = document.querySelector('#file-js-example .file-name');
      fileName.textContent = fileInput.files[0].name;
    }
  }

const form = document.querySelector('form');
const file = document.querySelector('input[name="file"]');

form.addEventListener('submit', async (e) =>{
    e.preventDefault();
    
    const{url, fields} = await fetch("http://ec2-44-200-41-166.compute-1.amazonaws.com:3000/getuploadurl").then(response =>response.json());
    
    const data = {
        bucket: "gif-2-bucket",
        ...fields,
        'Content-Type': file.files[0].type,
        file: file.files[0],
    };
    
     const formData  = new FormData();
      for (const name in data) {
        formData.append(name, data[name]);
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
    });