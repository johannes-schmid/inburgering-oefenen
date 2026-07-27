UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'premium' - 'plan'
  WHERE email = 'schmid.johannes90@gmail.com';