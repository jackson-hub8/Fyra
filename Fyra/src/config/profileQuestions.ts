/// file: profileQuestions.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Profile setup: 24 private questions (1–24).

export type QuestionDef = {
  id: keyof PrivateQuestionnairePayload;
  label: string;
  required: boolean;
  type: 'text' | 'textarea' | 'select' | 'tel';
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export type PrivateQuestionnairePayload = {
  gender: string;
  adaAccommodations: string;
  animalAllergies: string;
  varsitySport: string;
  smoking: string;
  alcohol: string;
  roomTemp: string;
  bedroomDescription: string;
  sleepType: string;
  weekdayBedtime: string;
  freeTime: string;
  campusActivity: string;
  visitorFrequency: string;
  weekendHomeFrequency: string;
  firstClassTime: string;
  musicPreference: string;
  politicalViews: string;
  religion: string;
  studyEnvironment: string;
  intendedMajor: string;
  vehicleToCampus: string;
};

export const PROFILE_QUESTIONS: QuestionDef[][] = [
  [
    {
      id: 'gender',
      label: 'What is your gender? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Female', label: 'Female' },
        { value: 'Male', label: 'Male' },
        { value: 'Non-binary', label: 'Non-binary' },
        { value: 'Other', label: 'Other' },
        { value: 'Prefer not to say', label: 'Prefer not to say' },
      ],
    },
    {
      id: 'adaAccommodations',
      label:
        'Do you have a medical, physical or psychological condition, as defined by the Americans with Disabilities Act (ADA) or the Fair Housing Act, that may require special housing accommodations? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'No', label: 'No' },
        { value: 'Yes', label: 'Yes' },
      ],
    },
    {
      id: 'animalAllergies',
      label: 'Please indicate if you have any allergies: *',
      required: true,
      type: 'textarea',
      placeholder: 'e.g. cats, dogs, none',
    },
    {
      id: 'varsitySport',
      label: 'Are you a member of a varsity sport or special program at Transy? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'No', label: 'No' },
        { value: 'Yes', label: 'Yes' },
      ],
    },
  ],
  [
    {
      id: 'smoking',
      label:
        'Although smoking is not permitted inside the residence halls, we attempt to place smokers together because of potential allergies. What are you? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Non-smoker', label: 'Non-smoker' },
        { value: 'Smoker', label: 'Smoker' },
      ],
    },
    {
      id: 'alcohol',
      label: 'What is your opinion regarding the drinking of alcoholic beverages? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Never drink', label: 'Never drink' },
        { value: 'Occasionally', label: 'Occasionally' },
        { value: 'Social drinker', label: 'Social drinker' },
        { value: 'Prefer not to say', label: 'Prefer not to say' },
      ],
    },
    {
      id: 'roomTemp',
      label: 'How do you prefer the temperature to be in your room? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Cool', label: 'Cool' },
        { value: 'Moderate', label: 'Moderate' },
        { value: 'Warm', label: 'Warm' },
      ],
    },
    {
      id: 'bedroomDescription',
      label: 'Describe your current bedroom: *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Very organized', label: 'Very organized' },
        { value: 'Organized', label: 'Organized' },
        { value: 'Disorganized but not messy', label: 'Disorganized but not messy' },
        { value: 'Messy', label: 'Messy' },
      ],
    },
    {
      id: 'sleepType',
      label: 'In relation to sleep, which of these best describes you? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Early Bird', label: 'Early Bird' },
        { value: 'Night Owl', label: 'Night Owl' },
        { value: 'Somewhere in between', label: 'Somewhere in between' },
      ],
    },
    {
      id: 'weekdayBedtime',
      label: 'What time do you plan to go to bed on weekdays? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Before 10pm', label: 'Before 10pm' },
        { value: '10pm–11pm', label: '10pm–11pm' },
        { value: '11pm–12am', label: '11pm–12am' },
        { value: '12am–1am', label: '12am–1am' },
        { value: 'After 1am', label: 'After 1am' },
      ],
    },
  ],
  [
    {
      id: 'freeTime',
      label: 'How would you prefer to spend your free time? *',
      required: true,
      type: 'textarea',
      placeholder: 'e.g. Reading, Cooking, Football, History',
    },
    {
      id: 'campusActivity',
      label: 'How active do you plan to be on campus? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Very active', label: 'Very active' },
        { value: 'Moderately active', label: 'Moderately active' },
        { value: 'Somewhat active', label: 'Somewhat active' },
        { value: 'Not very active', label: 'Not very active' },
      ],
    },
    {
      id: 'visitorFrequency',
      label: 'How frequently do you plan to have visitors in your room? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Rarely', label: 'Rarely' },
        { value: 'Sometimes', label: 'Sometimes' },
        { value: 'Often', label: 'Often' },
        { value: 'Very often', label: 'Very often' },
      ],
    },
    {
      id: 'weekendHomeFrequency',
      label: 'How often do you plan to go home on the weekends? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Almost every weekend', label: 'Almost every weekend' },
        { value: 'Often', label: 'Often' },
        { value: 'Sometimes', label: 'Sometimes' },
        { value: 'Rarely', label: 'Rarely' },
        { value: 'Never', label: 'Never' },
      ],
    },
    {
      id: 'firstClassTime',
      label: 'If you have the option, what time will your first class begin? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: '8am–9am', label: '8am–9am' },
        { value: '9am–10am', label: '9am–10am' },
        { value: '10am–11am', label: '10am–11am' },
        { value: '11am or later', label: '11am or later' },
      ],
    },
    {
      id: 'musicPreference',
      label: 'Of the following types of music, which one do you prefer? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Pop', label: 'Pop' },
        { value: 'Rock', label: 'Rock' },
        { value: 'Country', label: 'Country' },
        { value: 'Hip-hop/Rap', label: 'Hip-hop/Rap' },
        { value: 'Classical', label: 'Classical' },
        { value: 'Other', label: 'Other' },
      ],
    },
  ],
  [
    {
      id: 'politicalViews',
      label: 'In general, how would you describe your political views? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Very liberal', label: 'Very liberal' },
        { value: 'Liberal', label: 'Liberal' },
        { value: 'Moderate', label: 'Moderate' },
        { value: 'Conservative', label: 'Conservative' },
        { value: 'Very conservative', label: 'Very conservative' },
        { value: 'Prefer not to say', label: 'Prefer not to say' },
      ],
    },
    {
      id: 'religion',
      label: 'In relation to religion, which statement best describes you? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Very religious', label: 'Very religious' },
        { value: 'Somewhat religious', label: 'Somewhat religious' },
        { value: 'Not particularly religious', label: 'Not particularly religious' },
        { value: 'Not religious', label: 'Not religious' },
        { value: 'Prefer not to say', label: 'Prefer not to say' },
      ],
    },
    {
      id: 'studyEnvironment',
      label: 'What is your preferred study environment? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'In my room', label: 'In my room' },
        { value: 'Library', label: 'Library' },
        { value: 'Quiet space', label: 'Quiet space' },
        { value: 'With background noise', label: 'With background noise' },
      ],
    },
    {
      id: 'intendedMajor',
      label: 'What is your intended major? If unsure, put NA. *',
      required: true,
      type: 'text',
      placeholder: 'e.g. Mathematics, NA',
    },
    {
      id: 'vehicleToCampus',
      label: 'Do you plan to bring a vehicle to campus? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Yes', label: 'Yes' },
        { value: 'No', label: 'No' },
      ],
    },
  ],
];
