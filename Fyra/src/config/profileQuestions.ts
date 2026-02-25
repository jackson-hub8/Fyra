/// file: profileQuestions.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Profile setup: 24 private questions (1–24).

export type AllergyCategory = {
  category: string;
  options: { value: string; label: string }[];
};

export type SportCategory = {
  category: string;
  options: { value: string; label: string }[];
};

export type QuestionDef = {
  id: keyof PrivateQuestionnairePayload;
  label: string;
  required: boolean;
  type: 'text' | 'textarea' | 'select' | 'tel' | 'allergies' | 'sports' | 'tags' | 'checklist';
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** For type 'allergies': grouped checklist options. Last option may be "Other" and show a text input. */
  allergyCategories?: AllergyCategory[];
  /** For type 'sports': multi-select with categories. Use "None" as mutually exclusive option. */
  sportCategories?: SportCategory[];
  /** For type 'checklist': multi-select with maxSelections; singleChoiceValue (e.g. NA) is mutually exclusive. */
  checklistOptions?: { value: string; label: string }[];
  maxSelections?: number;
  singleChoiceValue?: string;
};

export type PrivateQuestionnairePayload = {
  gender: string;
  adaAccommodations: string;
  animalAllergies: string;
  varsitySport: string;
  smoking: string;
  cannabis: string;
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
      label: 'Do you have any allergies? *',
      required: true,
      type: 'allergies',
      allergyCategories: [
        {
          category: '',
          options: [
            { value: 'Cats', label: 'Cats' },
            { value: 'Dogs', label: 'Dogs' },
            { value: 'Smoke (cigarette or cannabis)', label: 'Smoke (cigarette or cannabis)' },
          ],
        },
        {
          category: '',
          options: [
            { value: 'Peanuts / tree nuts', label: 'Peanuts / tree nuts' },
            { value: 'Shellfish', label: 'Shellfish' },
            { value: 'Dairy', label: 'Dairy' },
            { value: 'Gluten', label: 'Gluten' },
          ],
        },
        {
          category: '',
          options: [{ value: 'Other', label: 'Other (please specify)' }],
        },
        {  category: '',  options: [{ value: 'None', label: 'None' }],},
      ],
    },
    {
      id: 'varsitySport',
      label: 'Select the sports you are a member of: *',
      required: true,
      type: 'sports',
      sportCategories: [
        {
          category: '',
          options: [
            { value: 'Baseball', label: 'Baseball' },
            { value: 'Basketball', label: 'Basketball' },
            { value: 'Cross Country', label: 'Cross Country' },
            { value: 'Golf', label: 'Golf' },
            { value: 'Lacrosse', label: 'Lacrosse' },
            { value: 'Soccer', label: 'Soccer' },
            { value: 'Swimming & Diving', label: 'Swimming & Diving' },
            { value: 'Tennis', label: 'Tennis' },
            { value: 'Track & Field', label: 'Track & Field' },
            { value: 'Cheerleading', label: 'Cheerleading' },
            { value: 'Dance', label: 'Dance' },
            { value: 'Eventing', label: 'Eventing' },
            { value: 'Esports', label: 'Esports' },
            { value: 'Field Hockey', label: 'Field Hockey' },
            { value: 'Softball', label: 'Softball' },
            { value: 'None', label: 'None' },
          ],
        },
      ],
    },
  ],
  [
    {
      id: 'smoking',
      label:
        'Although smoking is not permitted inside the residence halls, we attempt to place smokers together because of potential allergies. Nicotine (cigarettes/Vapes)? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Non-smoker', label: 'Non-smoker' },
        { value: 'Smoker', label: 'Smoker' },
      ],
    },
    {
      id: 'cannabis',
      label:
        'Cannabis? *',
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
        { value: 'Messy', label: 'Messy' },
        { value: 'Disorganized but not messy', label: 'Disorganized but not messy' },
        { value: 'Organized', label: 'Organized' },
        { value: 'Very organized', label: 'Very organized' },
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
      type: 'tags',
      placeholder: 'e.g. Reading, Cooking, Football, History',
    },
    {
      id: 'campusActivity',
      label: 'How active do you plan to be on campus? *',
      required: true,
      type: 'select',
      options: [
        { value: '', label: 'Select...' },
        { value: 'Not very active', label: 'Not very active' },
        { value: 'Somewhat active', label: 'Somewhat active' },
        { value: 'Moderately active', label: 'Moderately active' },
        { value: 'Very active', label: 'Very active' },
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
        { value: 'Never', label: 'Never' },
        { value: 'Rarely', label: 'Rarely' },
        { value: 'Sometimes', label: 'Sometimes' },
        { value: 'Often', label: 'Often' },
        { value: 'Almost every weekend', label: 'Almost every weekend' },
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
      type: 'checklist',
      maxSelections: 3,
      singleChoiceValue: 'NA',
      checklistOptions: [
        { value: 'Accounting', label: 'Accounting' },
        { value: 'Anthropology', label: 'Anthropology' },
        { value: 'Art History', label: 'Art History' },
        { value: 'Art, Teaching', label: 'Art, Teaching' },
        { value: 'Biology', label: 'Biology' },
        { value: 'Biology: Ecology, Evolution, and Behavior Track', label: 'Biology: Ecology, Evolution, and Behavior Track' },
        { value: 'Biology: Molecular and Cellular Track', label: 'Biology: Molecular and Cellular Track' },
        { value: 'Business Administration', label: 'Business Administration' },
        { value: 'Business Administration: Finance Track', label: 'Business Administration: Finance Track' },
        { value: 'Business Administration: Hospitality and Tourism Track', label: 'Business Administration: Hospitality and Tourism Track' },
        { value: 'Business Administration: Management Track', label: 'Business Administration: Management Track' },
        { value: 'Business Administration: Marketing Track', label: 'Business Administration: Marketing Track' },
        { value: 'Business Administration: Sport Management Track', label: 'Business Administration: Sport Management Track' },
        { value: 'Chemistry', label: 'Chemistry' },
        { value: 'Chemistry, Teaching', label: 'Chemistry, Teaching' },
        { value: 'Chemistry: Biochemistry Track', label: 'Chemistry: Biochemistry Track' },
        { value: 'Chinese', label: 'Chinese' },
        { value: 'Classics', label: 'Classics' },
        { value: 'Computer Science', label: 'Computer Science' },
        { value: 'Digital Arts and Media', label: 'Digital Arts and Media' },
        { value: 'Economics', label: 'Economics' },
        { value: 'Education', label: 'Education' },
        { value: 'Education and Social Change', label: 'Education and Social Change' },
        { value: 'English', label: 'English' },
        { value: 'French', label: 'French' },
        { value: 'Health and Exercise Science', label: 'Health and Exercise Science' },
        { value: 'History', label: 'History' },
        { value: 'International Affairs', label: 'International Affairs' },
        { value: 'Mathematics', label: 'Mathematics' },
        { value: 'Music Education', label: 'Music Education' },
        { value: 'Music Performance', label: 'Music Performance' },
        { value: 'Music Studies', label: 'Music Studies' },
        { value: 'Music Technology', label: 'Music Technology' },
        { value: 'Neuroscience', label: 'Neuroscience' },
        { value: 'Philosophy', label: 'Philosophy' },
        { value: 'Philosophy, Politics & Economics', label: 'Philosophy, Politics & Economics' },
        { value: 'Physics', label: 'Physics' },
        { value: 'Political Science', label: 'Political Science' },
        { value: 'Psychology', label: 'Psychology' },
        { value: 'Religion', label: 'Religion' },
        { value: 'Self-designed', label: 'Self-designed' },
        { value: 'Sociology', label: 'Sociology' },
        { value: 'Sociology/Anthropology', label: 'Sociology/Anthropology' },
        { value: 'Spanish', label: 'Spanish' },
        { value: 'Studio Art', label: 'Studio Art' },
        { value: 'Theater Arts', label: 'Theater Arts' },
        { value: 'Theater Design and Technology', label: 'Theater Design and Technology' },
        { value: 'Theater Performance', label: 'Theater Performance' },
        { value: 'Writing, Rhetoric, and Communication', label: 'Writing, Rhetoric, and Communication' },
        { value: 'Pre-Engineering Program', label: 'Pre-Engineering Program' },
        { value: 'Pre-Dental', label: 'Pre-Dental' },
        { value: 'Pre-Medical', label: 'Pre-Medical' },
        { value: 'Pre-Nursing', label: 'Pre-Nursing' },
        { value: 'Pre-Occupational Therapy', label: 'Pre-Occupational Therapy' },
        { value: 'Pre-Pharmacy', label: 'Pre-Pharmacy' },
        { value: 'Pre-Physical Therapy', label: 'Pre-Physical Therapy' },
        { value: 'Pre-Physician Assistant/Associate', label: 'Pre-Physician Assistant/Associate' },
        { value: 'Pre-Public Health', label: 'Pre-Public Health' },
        { value: 'Pre-Veterinary Medicine', label: 'Pre-Veterinary Medicine' },
        { value: 'Pre-Law Program', label: 'Pre-Law Program' },
        { value: 'NA', label: 'NA' },
      ],
    },
    {
      id: 'vehicleToCampus',
      label: 'Do you plan to bring a multi-passenger vehicle to campus? *',
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
