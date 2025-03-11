const { celebrate, Joi } = require("celebrate");
const validator = require("validator");

const validateURL = (value, helpers) => {
  if (validator.isURL(value)) {
    return value;
  }
  return helpers.error("string.uri");
};

module.exports.validateCardBody = celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30).messages({
      "string.min": 'The minimum length of the "name" field is 2',
      "string.max": 'The maximum length of the "name" field is 30',
      "string.empty": 'The "name" field must be filled in',
    }),
    weather_condition: Joi.string()
      .valid("hot", "warm", "cold", "wet")
      .required()
      .messages({
        "any.required": 'A "weather" field selection is required',
        "any.only": 'Please select a valid "weather" field selection',
      }),

    affiliate_link: Joi.string().optional().empty("").custom(validateURL),

  }),
});

module.exports.validateUserBody = celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30).messages({
      "string.min": 'The minimum length of the "name" field is 2',
      "string.max": 'The maximum length of the "name" field is 30',
      "string.empty": 'The "name" field must be filled in',
    }),
    avatar: Joi.string().optional().empty("").custom(validateURL),
    email: Joi.string().required().email().messages({
      "string.empty": 'The "email" field must be filled in',
      "string.email": 'The "email" field must be a valid email',
    }),
    password: Joi.string().required().messages({
      "string.empty": 'The "password" field must be filled in',
    }),
  }),
});

module.exports.validateUserUpdate = celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30).messages({
      "string.min": 'The minimum length of the "name" field is 2',
      "string.max": 'The maximum length of the "name" field is 30',
      "string.empty": 'The "name" field must be filled in',
    }),
    avatar: Joi.string().optional().empty("").custom(validateURL),
  }),
});

module.exports.validateUserCredentials = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email().messages({
      "string.empty": 'The "email" field must be filled in',
      "string.email": 'The "email" field must be a valid email',
    }),
    password: Joi.string().required().messages({
      "string.empty": 'The "password" field must be filled in',
    }),
  }),
});

module.exports.validateItemId = celebrate({
  params: Joi.object().keys({
    itemId: Joi.number().required().messages({
      "string.empty": 'The "itemId" field is required',
      "string.number": 'The "itemId" field must be an integer',

    }),
  }),
});

module.exports.validatePackingListId = celebrate({
  params: Joi.object().keys({
    packingListId: Joi.number().required().messages({
      "string.empty": 'The "packingListId" field is required',
      "string.number": 'The "packingListId" field must be an integer', 
    }),
  }),
});

module.exports.validatePackingListItemId = celebrate({
  params: Joi.object().keys({
    itemId: Joi.number().required().messages({
      // 'itemId' here refers to packing_list_items ID
      "string.empty": 'The "packingListItemId" field is required',
      "string.number": 'The "packingListItemId" field must be an integer', 
    }),
  }),
});


