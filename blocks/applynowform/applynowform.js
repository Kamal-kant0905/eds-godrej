import createField from './form-fields.js';
import { sampleRUM } from '../../scripts/aem.js';

export function ApiCall(METHOD, url, data) {
  // Return a promise
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: METHOD,
      headers: {
        'Content-Type': 'application/json',
        'auth-key': '9K43LtTEGpqmhAYgN10MPzqASvRmUKLk',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            reject(err);
          });
        }
        return response.json();
      })
      .then((datajson) => resolve(datajson))
      .catch((error) => reject(error));
  });
}
export function toggleResendOTPClass(active) {
  const resendOtpParagraph = document.getElementById('form-message3');
  if (active) {
    resendOtpParagraph.classList.remove('inactive');
    resendOtpParagraph.classList.add('active');
    resendOtpParagraph.removeAttribute('disabled');
  } else {
    resendOtpParagraph.classList.remove('active');
    resendOtpParagraph.classList.add('inactive');
    resendOtpParagraph.setAttribute('disabled', 'disabled');
  }
}

export function startTimer() {
  let seconds = 30;
  const otpConfirmationParagraph = document.getElementById('form-message2');

  // Initially add inactive class
  toggleResendOTPClass(false);

  const intervalId = setInterval(() => {
    seconds -= 1;
    otpConfirmationParagraph.textContent = `Didn't receive any OTP? ${seconds} Seconds`;

    if (seconds === 0) {
      clearInterval(intervalId);
      toggleResendOTPClass(true); // Add active class
    }
  }, 1000);
}
// Function to resend OTP
export function resendOTP() {
  const seconds = 30;
  const otpConfirmationParagraph = document.getElementById('form-message2');
  otpConfirmationParagraph.textContent = `Didn't receive any OTP? ${seconds} Seconds`;

  // Code to resend OTP goes here
  console.log('Resending OTP...');

  // Reset the timer and restart it
  startTimer();
}

// Function to start the timer

export function retrieveOTP() {
  let otp = '';
  // Loop through each input field
  document
    .querySelectorAll("fieldset#form-box input[type='text']")
    .forEach((input) => {
      // Concatenate the value of each input field
      otp += input.value;
    });
  console.log(otp);
  // Return the concatenated OTP
  return otp;
}

export function generateOtpPayload(formPayload) {
  const customPayload = {
    product: formPayload.loanType,
    name: formPayload.FullName,
    username: formPayload.Mobile,
    email: formPayload.Email,
    outSource: 'GodrejCapitalWebsite',
    pageUrl: 'https://www.godrejcapital.com/apply-now.html',
    pageTitle: 'Apply Now',
    mx_Refferral_URL: '',
    mx_Refferal_Type: 'direct',
  };
  return customPayload;
}

export function generateVerifyOtpPayload(formPayload) {
  const customPayload = {
    product: formPayload.loanType,
    name: formPayload.FullName,
    username: formPayload.Mobile,
    email: formPayload.Email,
    outSource: 'GodrejCapitalWebsite',
    pageUrl: 'https://www.godrejcapital.com/apply-now.html#HomeLoan',
    pageTitle: 'Apply Now',
    mx_Refferral_URL: '',
    mx_Refferal_Type: 'direct',
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
  };
  return customPayload;
}

export async function handleVerify(payload, userMobileNumber) {
  if (userMobileNumber) {
    try {
      const response = await ApiCall(
        'POST',
        `https://h9qipagt5.godrejfinance.com/v1/ehf/outsources/validateotp/${userMobileNumber}/${retrieveOTP()}`,
        payload,
      );
      if (response.ok) {
        window.location.href = 'https://your-redirect-url.com/success-page';
      } else {
        // Handle unsuccessful validation
        console.error('OTP validation failed:', response);
      }
    } catch (error) {
      console.error('Error during OTP validation:', error);
    }
  } else {
    console.error('Mobile number not found.');
  }
}

export function autoFocusEl(form) {
  const inputs = form.querySelectorAll('#form-box  input');

  inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
}

export function changeNumberFunctinality(block) {
  const changeNumber = block.querySelector('#form-common #change-number');
  changeNumber.addEventListener('click', () => {
    const verifyFormEl = block.querySelectorAll('.verify-step');
    verifyFormEl.forEach((el) => {
      el.style.display = 'none';
    });
    const registrationFormEl = block.querySelectorAll('.step1');
    registrationFormEl.forEach((el) => {
      el.style.display = 'block';
    });

    const submitBtnRegistration = block.querySelector(
      '.step1.submit-registration button',
    );
    submitBtnRegistration.removeAttribute('disabled');
  });
}

let userMobNo = null;

async function createForm(formHref) {
  const { pathname } = new URL(formHref);
  const resp = await fetch(pathname);
  const json = await resp.json();

  const form = document.createElement('form');
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];

  const fields = await Promise.all(json.data.map((fd) => createField(fd, form)));
  fields.forEach((field) => {
    if (field) {
      form.append(field);
    }
  });

  // group fields into fieldsets
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets.forEach((fieldset) => {
    form.querySelectorAll(`[data-fieldset="${fieldset.name}"`).forEach((field) => {
      fieldset.append(field);
    });
  });

  return form;
}

function generatePayload(form) {
  const payload = {};

  [...form.elements].forEach((field) => {
    if (field.name && field.type !== 'submit' && !field.disabled) {
      if (field.type === 'radio') {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        if (field.checked) payload[field.name] = payload[field.name] ? `${payload[field.name]},${field.value}` : field.value;
      } else {
        payload[field.name] = field.value;
      }
    }
  });
  return payload;
}

function validateCheckboxes(form) {
  // Select the checkboxes you want to validate
  const checkboxes = form.querySelectorAll('input[type="checkbox"][name="loanType"]');

  // Convert NodeList to Array and use some() to check if at least one checkbox is checked
  const isAnyCheckboxChecked = Array.from(checkboxes).some((checkbox) => checkbox.checked);

  return isAnyCheckboxChecked; // Returns true if at least one checkbox is checked, otherwise false
}

function showError(fieldset, message) {
  // Check if an error message already exists
  let errorDiv = fieldset.querySelector('.error-message');
  if (!errorDiv) {
    // Create error message element if it doesn't exist
    errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red'; // Add some styling
    fieldset.insertAdjacentElement('afterend', errorDiv);
  }
  errorDiv.textContent = message;
}

function handleSubmitError(form, error) {
  // eslint-disable-next-line no-console
  console.error(error);
  form.querySelector('button[type="submit"]').disabled = false;
  sampleRUM('form:error', { source: '.form', target: error.stack || error.message || 'unknown error' });
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') === 'true') return;

  const submit = form.querySelector('button[type="submit"]');
  try {
    form.setAttribute('data-submitting', 'true');
    submit.disabled = true;

    const loanTypeFieldset = form.querySelector('#loanTypeFieldset');

    if (!validateCheckboxes(form)) {
      showError(loanTypeFieldset, 'Please select at least one loan type.');
      submit.disabled = false;
      form.setAttribute('data-submitting', 'false');
      return;
    }

    // create payload
    const payload = generatePayload(form);
    console.log(payload);

    userMobNo = payload.Mobile;
    console.log(userMobNo);
    const mobileNoStr = userMobNo.toString();
    const lastFourDigits = mobileNoStr.slice(-4);
    console.log(lastFourDigits);

    const otpEl = document.querySelector('#form-message');

    // Replace last four digits in otpEl.textContent
    const otpText = otpEl.textContent;
    const otpTextWithoutDigits = otpText.replace(/\d{4}$/, '');
    otpEl.textContent = `${otpTextWithoutDigits} ${lastFourDigits}`;

    console.log(otpEl.textContent);

    const mobileNoVerifyStep = document.querySelector('#form-mobile-number');
    if (mobileNoVerifyStep) {
      mobileNoVerifyStep.value = userMobNo;
      mobileNoVerifyStep.readOnly = true;
    }

    // Function to ensure only one digit is entered
    const enforceSingleDigit = function (event) {
      const inputField = event.target;
      let { value } = inputField;
      // Allow only numeric input and truncate to one character
      if (!/^\d$/.test(value)) {
        value = value.replace(/[^\d]/g, '');
      }
      inputField.value = value.slice(0, 1);
    };

    const otpFieldsEls = document.querySelectorAll('#form-box input[type="text"]');
    otpFieldsEls.forEach((otpFieldEl) => {
      otpFieldEl.addEventListener('input', enforceSingleDigit);
    });

    startTimer();

    ApiCall('POST', 'https://h9qipagt5.godrejfinance.com/v1/ehf/outsources/generateotp', generateOtpPayload(payload));
    document.getElementById('form-message3').addEventListener('click', () => {
      const element = document.getElementById('form-message3');
      if (element.classList.contains('active')) {
        ApiCall('POST', 'https://h9qipagt5.godrejfinance.com/v1/ehf/outsources/generateotp', generateOtpPayload(payload));
        resendOTP();
      } else {
        console.log('The element does not have the class "active".');
      }
    });
  } catch (e) {
    handleSubmitError(form, e);
  } finally {
    form.setAttribute('data-submitting', 'false');
  }
}

export default async function decorate(block) {
  const formLink = block.querySelector('a[href$=".json"]');
  if (!formLink) return;

  const form = await createForm(formLink.href);
  autoFocusEl(form);
  block.replaceChildren(form);

  const verifyFormEl = block.querySelectorAll('.verify-step');
  verifyFormEl.forEach((el) => {
    el.style.display = 'none';
  });

  changeNumberFunctinality(block);

  form.addEventListener('submit', (e) => {
    console.log('clicked');
    e.preventDefault();
    const valid = form.checkValidity();
    if (valid) {
      handleSubmit(form);
      const registrationFormEl = block.querySelectorAll('.step1');
      registrationFormEl.forEach((el) => {
        el.style.display = 'none';
      });
      verifyFormEl.forEach((el) => {
        el.style.display = 'block';
      });
    } else {
      const firstInvalidEl = form.querySelector(':invalid:not(fieldset)');
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  function validateForm() {
    const fields = document.querySelectorAll('#form-box input[type="text"]');
    let isAnyFieldEmpty = false;

    // Remove existing error message if any
    const existingErrorMessage = document.getElementById('error-message');
    if (existingErrorMessage) {
      existingErrorMessage.remove();
    }

    // Check if any field is empty
    fields.forEach((field) => {
      if (field.value.trim() === '') {
        isAnyFieldEmpty = true;
      }
    });

    if (isAnyFieldEmpty) {
      // Create a new error message
      const errorMessage = document.createElement('div');
      errorMessage.id = 'error-message';
      errorMessage.className = 'error';
      errorMessage.textContent = 'Please enter the valid OTP';

      // Append the error message to the fieldset
      const formBox = document.getElementById('form-box');
      formBox.parentNode.insertBefore(errorMessage, formBox.nextSibling);
      return false; // Form is not valid
    }

    return true; // Form is valid
  }

  const verifyFormBtn = document.querySelector('.verify-step.btn-verify-step button');
  verifyFormBtn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('hello from step 2');
    if (validateForm()) {
      const payload = generatePayload(form);
      if (payload) {
        handleVerify(generateVerifyOtpPayload(payload), payload.Mobile);
      } else {
        console.error('error payload is not retrived');
      }
      // You can now proceed with the payload
    }
  });
}

// const SELECTORS = {
//   'radio-button-selector': '.loan-type-container .radio-wrapper input[type="radio"]',
// };
